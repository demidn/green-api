import { openMessagingDatabase, notificationLeaseStoreName } from "./database";

interface NotificationLeaseRecord {
  id: string;
  owner: string;
  leaseUntil: number;
}

export async function acquireNotificationLease(owner: string, duration: number): Promise<boolean> {
  const database = await openMessagingDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(notificationLeaseStoreName, "readwrite");
    const store = transaction.objectStore(notificationLeaseStoreName);
    const request = store.get("receiver");
    let acquired = false;
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const current = request.result as NotificationLeaseRecord | undefined;
      if (!current || current.owner === owner || current.leaseUntil <= Date.now()) {
        acquired = true;
        store.put({ id: "receiver", owner, leaseUntil: Date.now() + duration });
      }
    };
    transaction.oncomplete = () => resolve(acquired);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function renewNotificationLease(owner: string, duration: number): Promise<boolean> {
  const database = await openMessagingDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(notificationLeaseStoreName, "readwrite");
    const store = transaction.objectStore(notificationLeaseStoreName);
    const request = store.get("receiver");
    let renewed = false;
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const current = request.result as NotificationLeaseRecord | undefined;
      if (current?.owner === owner) {
        renewed = true;
        store.put({ ...current, leaseUntil: Date.now() + duration });
      }
    };
    transaction.oncomplete = () => resolve(renewed);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function releaseNotificationLease(owner: string): Promise<void> {
  const database = await openMessagingDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(notificationLeaseStoreName, "readwrite");
    const store = transaction.objectStore(notificationLeaseStoreName);
    const request = store.get("receiver");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      if ((request.result as NotificationLeaseRecord | undefined)?.owner === owner) {
        store.delete("receiver");
      }
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
