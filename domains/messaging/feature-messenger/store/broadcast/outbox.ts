import { logError } from "@/shared/logger";

export const outboxChannelName = "green-api-max-outbox";

const changedSubscribers = new Set<() => void>();
const wakeSubscribers = new Set<() => void>();

export function subscribeOutboxChanged(handler: () => void) {
  changedSubscribers.add(handler);
  return () => {
    changedSubscribers.delete(handler);
  };
}

export function notifyOutboxChanged() {
  for (const handler of changedSubscribers) {
    try {
      handler();
    } catch (error) {
      logError("Failed to notify outbox change", error);
    }
  }
  if (typeof BroadcastChannel === "undefined") {
    return;
  }
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(outboxChannelName);
    channel.postMessage("changed");
  } catch (error) {
    logError("Failed to broadcast outbox change", error);
  } finally {
    try {
      channel?.close();
    } catch (error) {
      logError("Failed to close outbox channel", error);
    }
  }
}

export function subscribeOutboxWake(handler: () => void) {
  wakeSubscribers.add(handler);
  return () => {
    wakeSubscribers.delete(handler);
  };
}

export function notifyOutboxWake() {
  for (const handler of wakeSubscribers) {
    try {
      handler();
    } catch (error) {
      logError("Failed to notify outbox wake", error);
    }
  }
}
