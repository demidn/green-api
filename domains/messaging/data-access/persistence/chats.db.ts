import type { Chat } from "@/domains/messaging/domain";
import { chatsStoreName, openMessagingDatabase } from "./database";

export async function readChats(): Promise<Chat[]> {
  const database = await openMessagingDatabase();
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
  const database = await openMessagingDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(chatsStoreName, "readwrite");
    const request = transaction.objectStore(chatsStoreName).put(chat);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}
