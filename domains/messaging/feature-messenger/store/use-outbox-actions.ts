"use client";

import { useCallback } from "react";
import {
  deleteOutboxItem,
  reconcileOutbox,
  updateOutboxItem,
  writeOutboxItem,
} from "@/domains/messaging/data-access";
import type { OutboxMessage } from "@/domains/messaging/data-access";
import { notifyOutboxChanged } from "./broadcast/outbox";

function createId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export function useOutboxActions() {
  const enqueue = useCallback(async (chatId: string, text: string) => {
    const item: OutboxMessage = {
      id: createId(),
      chatId,
      text,
      createdAt: Date.now(),
      status: "pending",
      attempts: 0,
      nextAttemptAt: 0,
    };
    await writeOutboxItem(item);
    notifyOutboxChanged();
    return item;
  }, []);
  const remove = useCallback(async (id: string) => {
    await deleteOutboxItem(id);
    notifyOutboxChanged();
  }, []);
  const retry = useCallback(async (id: string) => {
    const item = await updateOutboxItem(id, {
      status: "pending",
      attempts: 0,
      nextAttemptAt: 0,
      error: undefined,
      leaseOwner: undefined,
      leaseUntil: undefined,
    });
    if (item) {
      notifyOutboxChanged();
    }
  }, []);
  const reconcile = useCallback(async (remoteIds: Set<string>) => {
    const removedIds = await reconcileOutbox(remoteIds);
    if (removedIds.length > 0) {
      notifyOutboxChanged();
    }
  }, []);
  return { enqueue, remove, retry, reconcile };
}
