import type { OutboxMessage } from "./outbox.types";
import type { Chat } from "@/domains/messaging/domain";
import { MAXIMUM_SEND_ATTEMPTS } from "@/domains/messaging/domain";

const databaseName = "green-api-max";
const databaseVersion = 2;
const outboxStoreName = "outbox";
const chatsStoreName = "chats";
let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) {
    return databasePromise;
  }
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onerror = () => {
      databasePromise = null;
      reject(request.error);
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        databasePromise = null;
      };
      resolve(database);
    };
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(outboxStoreName)) {
        database.createObjectStore(outboxStoreName, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(chatsStoreName)) {
        database.createObjectStore(chatsStoreName, { keyPath: "id" });
      }
    };
  });
  return databasePromise;
}

export async function readChats(): Promise<Chat[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(chatsStoreName, "readonly")
      .objectStore(chatsStoreName)
      .getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as Chat[]);
  });
}

export async function writeChat(chat: Chat): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(chatsStoreName, "readwrite");
    const request = transaction.objectStore(chatsStoreName).put(chat);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function readOutbox(): Promise<OutboxMessage[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(outboxStoreName, "readonly")
      .objectStore(outboxStoreName)
      .getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () =>
      resolve(
        (request.result as Array<Omit<OutboxMessage, "status"> & { status: string }>)
          .map((item) => ({
            ...item,
            status: item.status === "sent" ? "accepted" : (item.status as OutboxMessage["status"]),
          }))
          .sort((a, b) => a.createdAt - b.createdAt),
      );
  });
}

export async function writeOutboxItem(item: OutboxMessage): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(outboxStoreName, "readwrite");
    const request = transaction.objectStore(outboxStoreName).put(item);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function updateOutboxItem(
  id: string,
  change: Partial<OutboxMessage>,
): Promise<OutboxMessage | null> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(outboxStoreName, "readwrite");
    const store = transaction.objectStore(outboxStoreName);
    const request = store.get(id);
    let updated: OutboxMessage | null = null;
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      if (!request.result) {
        return;
      }
      updated = { ...(request.result as OutboxMessage), ...change };
      store.put(updated);
    };
    transaction.oncomplete = () => resolve(updated);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function deleteOutboxItem(id: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(outboxStoreName, "readwrite");
    const request = transaction.objectStore(outboxStoreName).delete(id);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function reconcileOutbox(remoteIds: Set<string>): Promise<string[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(outboxStoreName, "readwrite");
    const store = transaction.objectStore(outboxStoreName);
    const request = store.getAll();
    const removedIds: string[] = [];
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      for (const item of request.result as OutboxMessage[]) {
        if (item.remoteMessageId && remoteIds.has(item.remoteMessageId)) {
          removedIds.push(item.id);
          store.delete(item.id);
        }
      }
    };
    transaction.oncomplete = () => resolve(removedIds);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function claimNextOutbox(
  owner: string,
  leaseDuration: number,
): Promise<OutboxMessage | null> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(outboxStoreName, "readwrite");
    const store = transaction.objectStore(outboxStoreName);
    const request = store.getAll();
    let claimed: OutboxMessage | null = null;
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const now = Date.now();
      const items = (request.result as OutboxMessage[]).map((item) => {
        if (item.status !== "sending" || (item.leaseUntil ?? 0) > now) {
          return item;
        }
        const recovered = {
          ...item,
          status: "pending" as const,
          leaseOwner: undefined,
          leaseUntil: undefined,
        };
        store.put(recovered);
        return recovered;
      });
      claimed =
        items
          .filter(
            (item) =>
              item.status === "pending" &&
              item.attempts < MAXIMUM_SEND_ATTEMPTS &&
              item.nextAttemptAt <= now,
          )
          .sort((a, b) => a.nextAttemptAt - b.nextAttemptAt || a.createdAt - b.createdAt)[0] ??
        null;
      if (claimed) {
        claimed = {
          ...claimed,
          status: "sending",
          leaseOwner: owner,
          leaseUntil: now + leaseDuration,
        };
        store.put(claimed);
      }
    };
    transaction.oncomplete = () => resolve(claimed);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function getNextOutboxWakeAt(): Promise<number | null> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database
      .transaction(outboxStoreName, "readonly")
      .objectStore(outboxStoreName)
      .getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const now = Date.now();
      const candidates = (request.result as OutboxMessage[]).flatMap((item) => {
        if (
          item.status === "pending" &&
          item.attempts < MAXIMUM_SEND_ATTEMPTS &&
          item.nextAttemptAt > now
        ) {
          return [item.nextAttemptAt];
        }
        const leaseUntil = item.leaseUntil;
        if (item.status === "sending" && leaseUntil !== undefined && leaseUntil > now) {
          return [leaseUntil];
        }
        return [];
      });
      resolve(candidates.length > 0 ? Math.min(...candidates) : null);
    };
  });
}
