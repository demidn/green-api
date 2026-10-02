let wakeHandler: (() => void) | null = null;
export const outboxChannelName = "green-api-max-outbox";

export function registerOutboxWake(handler: () => void) {
  wakeHandler = handler;
  return () => {
    if (wakeHandler === handler) {
      wakeHandler = null;
    }
  };
}

export function notifyOutboxWake() {
  wakeHandler?.();
}
