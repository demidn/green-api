"use client";

import { useAtom, useAtomValue } from "jotai";
import { useCallback } from "react";
import { outboxAtom, outboxHydratedAtom } from "./outbox.atom";
import {
  claimNextOutbox,
  deleteOutboxItem,
  getNextOutboxWakeAt,
  reconcileOutbox,
  updateOutboxItem,
  writeOutboxItem,
} from "./outbox.db";
import type { OutboxMessage } from "./outbox.types";
import { outboxChannelName } from "./outbox-events";

export function notifyOutboxChanged() {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }
  const channel = new BroadcastChannel(outboxChannelName);
  channel.postMessage("changed");
  channel.close();
}

function createId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export function useOutboxStore() {
  const [items, setItems] = useAtom(outboxAtom);
  const hydrated = useAtomValue(outboxHydratedAtom);

  const enqueue = useCallback(
    async (chatId: string, text: string) => {
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
      setItems((current) => [...current, item]);
      notifyOutboxChanged();
      return item;
    },
    [setItems],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteOutboxItem(id);
      setItems((current) => current.filter((item) => item.id !== id));
      notifyOutboxChanged();
    },
    [setItems],
  );

  const retry = useCallback(
    async (id: string) => {
      const item = await updateOutboxItem(id, {
        status: "pending",
        attempts: 0,
        nextAttemptAt: 0,
        error: undefined,
        leaseOwner: undefined,
        leaseUntil: undefined,
      });
      if (!item) {
        return;
      }
      setItems((current) => current.map((entry) => (entry.id === id ? item : entry)));
      notifyOutboxChanged();
    },
    [setItems],
  );

  const claimNext = useCallback(
    async (owner: string) => {
      const item = await claimNextOutbox(owner, 30_000);
      if (item) {
        setItems((current) => current.map((entry) => (entry.id === item.id ? item : entry)));
        notifyOutboxChanged();
      }
      return item;
    },
    [setItems],
  );

  const getNextWakeAt = useCallback(() => getNextOutboxWakeAt(), []);

  const markAccepted = useCallback(
    async (id: string, remoteMessageId: string) => {
      const item = await updateOutboxItem(id, {
        status: "accepted",
        remoteMessageId,
        nextAttemptAt: 0,
        leaseOwner: undefined,
        leaseUntil: undefined,
      });
      if (!item) {
        return;
      }
      setItems((current) => current.map((entry) => (entry.id === id ? item : entry)));
      notifyOutboxChanged();
    },
    [setItems],
  );

  const markRetry = useCallback(
    async (id: string, attempts: number, nextAttemptAt: number, error: string) => {
      const item = await updateOutboxItem(id, {
        status: "pending",
        attempts,
        nextAttemptAt,
        error,
        leaseOwner: undefined,
        leaseUntil: undefined,
      });
      if (!item) {
        return;
      }
      setItems((current) => current.map((entry) => (entry.id === id ? item : entry)));
      notifyOutboxChanged();
    },
    [setItems],
  );

  const markFailed = useCallback(
    async (id: string, attempts: number, error: string) => {
      const item = await updateOutboxItem(id, {
        status: "failed",
        attempts,
        nextAttemptAt: 0,
        error,
        leaseOwner: undefined,
        leaseUntil: undefined,
      });
      if (!item) {
        return;
      }
      setItems((current) => current.map((entry) => (entry.id === id ? item : entry)));
      notifyOutboxChanged();
    },
    [setItems],
  );

  const reconcile = useCallback(
    async (remoteIds: Set<string>) => {
      const removedIds = await reconcileOutbox(remoteIds);
      if (removedIds.length === 0) {
        return;
      }
      const removed = new Set(removedIds);
      setItems((current) => current.filter((item) => !removed.has(item.id)));
      notifyOutboxChanged();
    },
    [setItems],
  );

  return {
    items,
    hydrated,
    enqueue,
    remove,
    retry,
    reconcile,
    claimNext,
    getNextWakeAt,
    markAccepted,
    markRetry,
    markFailed,
  };
}
