"use client";

import {
  claimNextOutbox,
  getNextOutboxWakeAt,
  updateOutboxItem,
} from "@/domains/messaging/data-access";
import type { SendMessageInput, SentMessage } from "@/domains/messaging/data-access";
import { MAXIMUM_SEND_ATTEMPTS } from "@/domains/messaging/domain";
import { logError } from "@/shared/logger";
import { notifyOutboxChanged, subscribeOutboxWake } from "../broadcast/outbox";

const INITIAL_RETRY_DELAY = 1_000;
const MAX_RETRY_DELAY = 30_000;
const OUTBOX_LEASE_DURATION = 30_000;

interface OutboxSenderRuntime {
  sendMessage: (input: SendMessageInput) => Promise<SentMessage>;
}

function retryDelay(attempts: number) {
  return Math.min(MAX_RETRY_DELAY, INITIAL_RETRY_DELAY * 2 ** Math.max(0, attempts - 1));
}

function createOwnerId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export const outboxSenderUseCase = {
  run(runtime: OutboxSenderRuntime) {
    const ownerId = createOwnerId();
    let active = true;
    let running = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let wakeRequested = false;

    function schedule(delay: number) {
      if (!active || timer) {
        return;
      }
      timer = setTimeout(() => {
        timer = null;
        wake();
      }, delay);
    }

    function wake() {
      if (!active) {
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
      void process().catch((error) => logError("Outbox sender processing failed", error));
    }

    async function update(id: string, change: Parameters<typeof updateOutboxItem>[1]) {
      const item = await updateOutboxItem(id, change);
      if (item) {
        notifyOutboxChanged();
      }
      return item;
    }

    async function process() {
      if (!active || running) {
        return;
      }
      running = true;
      try {
        while (active) {
          const next = await claimNextOutbox(ownerId, OUTBOX_LEASE_DURATION);
          if (!next) {
            const nextWakeAt = await getNextOutboxWakeAt();
            if (nextWakeAt !== null) {
              schedule(Math.max(0, nextWakeAt - Date.now()));
            }
            break;
          }
          notifyOutboxChanged();
          try {
            const result = await runtime.sendMessage({ chatId: next.chatId, message: next.text });
            await update(next.id, {
              status: "accepted",
              remoteMessageId: result.id,
              nextAttemptAt: 0,
              leaseOwner: undefined,
              leaseUntil: undefined,
            });
          } catch (error) {
            const attempts = next.attempts + 1;
            const message =
              error instanceof Error ? error.message : "Не удалось отправить сообщение";
            if (attempts >= MAXIMUM_SEND_ATTEMPTS) {
              await update(next.id, {
                status: "failed",
                attempts,
                nextAttemptAt: 0,
                error: message,
                leaseOwner: undefined,
                leaseUntil: undefined,
              });
            } else {
              await update(next.id, {
                status: "pending",
                attempts,
                nextAttemptAt: Date.now() + retryDelay(attempts),
                error: message,
                leaseOwner: undefined,
                leaseUntil: undefined,
              });
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

    const unsubscribe = subscribeOutboxWake(wake);
    wake();
    return () => {
      active = false;
      wakeRequested = false;
      unsubscribe();
      if (timer) {
        clearTimeout(timer);
      }
      timer = null;
    };
  },
};
