"use client";

import type { OutboxMessage } from "./outbox.types";
import type { SendMessageInput, SentMessage } from "@/domains/messaging/data-access";
import { MAXIMUM_SEND_ATTEMPTS } from "@/domains/messaging/domain";
import { logError } from "@/shared/logger";

const INITIAL_RETRY_DELAY = 1_000;
const MAX_RETRY_DELAY = 30_000;

function retryDelay(attempts: number) {
  return Math.min(MAX_RETRY_DELAY, INITIAL_RETRY_DELAY * 2 ** Math.max(0, attempts - 1));
}

function createOwnerId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export interface SenderDependencies {
  isReady: () => boolean;
  claimNext: (ownerId: string) => Promise<OutboxMessage | null>;
  getNextWakeAt: () => Promise<number | null>;
  sendMessage: (input: SendMessageInput) => Promise<SentMessage>;
  markAccepted: (id: string, remoteMessageId: string) => Promise<void>;
  markRetry: (id: string, attempts: number, nextAttemptAt: number, error: string) => Promise<void>;
  markFailed: (id: string, attempts: number, error: string) => Promise<void>;
}

function createOutboxSender() {
  let dependencies: SenderDependencies | null = null;
  let running = false;
  let disposed = true;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let wakeRequested = false;
  let configurationId = 0;
  const ownerId = createOwnerId();

  function configure(nextDependencies: SenderDependencies) {
    const id = ++configurationId;
    dependencies = nextDependencies;
    disposed = false;
    return () => {
      if (id === configurationId) {
        stop();
      }
    };
  }

  function schedule(delay: number) {
    if (disposed || timer) {
      return;
    }
    timer = setTimeout(() => {
      timer = null;
      wake();
    }, delay);
  }

  function wake() {
    if (disposed) {
      return;
    }
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (running) {
      wakeRequested = true;
      return;
    }
    void process().catch((error) => {
      logError("Outbox sender processing failed", error);
    });
  }

  function stop() {
    configurationId += 1;
    disposed = true;
    wakeRequested = false;
    if (timer) {
      clearTimeout(timer);
    }
    timer = null;
    dependencies = null;
  }

  async function process() {
    if (running || disposed) {
      return;
    }
    running = true;
    try {
      while (!disposed) {
        const current = dependencies;
        if (!current || !current.isReady()) {
          break;
        }
        const next = await current.claimNext(ownerId);
        if (!next) {
          const nextWakeAt = await current.getNextWakeAt();
          if (nextWakeAt !== null) {
            schedule(Math.max(0, nextWakeAt - Date.now()));
          }
          break;
        }
        try {
          const result = await current.sendMessage({ chatId: next.chatId, message: next.text });
          await current.markAccepted(next.id, result.id);
        } catch (error) {
          const attempts = next.attempts + 1;
          const message = error instanceof Error ? error.message : "Message send failed";
          if (attempts >= MAXIMUM_SEND_ATTEMPTS) {
            await current.markFailed(next.id, attempts, message);
          } else {
            await current.markRetry(next.id, attempts, Date.now() + retryDelay(attempts), message);
          }
        }
      }
    } finally {
      running = false;
      if (wakeRequested) {
        wakeRequested = false;
        wake();
      }
    }
  }

  return { configure, wake, stop };
}

const sender = createOutboxSender();

export function configureOutboxSender(dependencies: SenderDependencies) {
  return sender.configure(dependencies);
}

export function wakeOutboxSender() {
  sender.wake();
}
