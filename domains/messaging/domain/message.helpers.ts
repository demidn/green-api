import type { MessageWithStatus } from "./message-with-status";

export interface MessageTimestampParts {
  time: string;
  date: string;
}

export function formatMessageTimestamp(timestamp: number | Date): MessageTimestampParts {
  const value = typeof timestamp === "number" ? new Date(timestamp * 1000) : timestamp;
  return {
    time: value.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
    date: value.toLocaleDateString("ru-RU"),
  };
}

export function mergeMessagesByTimestamp(
  remote: MessageWithStatus[],
  optimistic: MessageWithStatus[],
) {
  const merged: MessageWithStatus[] = [];
  let remoteIndex = 0;
  let optimisticIndex = 0;
  while (remoteIndex < remote.length && optimisticIndex < optimistic.length) {
    if (remote[remoteIndex].message.timestamp >= optimistic[optimisticIndex].message.timestamp) {
      merged.push(remote[remoteIndex]);
      remoteIndex += 1;
    } else {
      merged.push(optimistic[optimisticIndex]);
      optimisticIndex += 1;
    }
  }
  merged.push(...remote.slice(remoteIndex), ...optimistic.slice(optimisticIndex));
  return merged;
}
