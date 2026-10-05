const databaseName = "green-api-max";
const databaseVersion = 4;
const outboxStoreName = "outbox";
const chatsStoreName = "chats";
const notificationLeaseStoreName = "notification-lease";

let databasePromise: Promise<IDBDatabase> | null = null;

export function openMessagingDatabase(): Promise<IDBDatabase> {
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
      if (!database.objectStoreNames.contains(notificationLeaseStoreName)) {
        database.createObjectStore(notificationLeaseStoreName, { keyPath: "id" });
      }
    };
  });
  return databasePromise;
}

export { chatsStoreName, notificationLeaseStoreName, outboxStoreName };
