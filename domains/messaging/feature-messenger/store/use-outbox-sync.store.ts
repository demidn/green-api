"use client";

import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { readOutbox } from "@/domains/messaging/data-access";
import { logError } from "@/shared/logger";
import { outboxAtom, outboxHydratedAtom } from "./outbox.atom";
import { notifyOutboxWake, outboxChannelName, subscribeOutboxChanged } from "./broadcast/outbox";

export function useOutboxSyncStore() {
  const setItems = useSetAtom(outboxAtom);
  const setHydrated = useSetAtom(outboxHydratedAtom);

  useEffect(() => {
    let active = true;
    const reloadOutbox = async () => {
      try {
        const stored = await readOutbox();
        if (!active) {
          return;
        }
        setItems(stored);
        notifyOutboxWake();
      } catch (error) {
        logError("Failed to reload outbox", error);
      }
    };
    const hydrateOutbox = async () => {
      try {
        const stored = await readOutbox();
        if (!active) {
          return;
        }
        setItems(stored);
        setHydrated(true);
      } catch (error) {
        logError("Failed to hydrate outbox", error);
      }
    };

    void hydrateOutbox();
    const unsubscribe = subscribeOutboxChanged(() => void reloadOutbox());
    if (typeof BroadcastChannel === "undefined") {
      return () => {
        active = false;
        unsubscribe();
      };
    }
    const channel = new BroadcastChannel(outboxChannelName);
    const listener = () => {
      void reloadOutbox();
    };
    channel.addEventListener("message", listener);
    return () => {
      active = false;
      unsubscribe();
      channel.removeEventListener("message", listener);
      channel.close();
    };
  }, [setHydrated, setItems]);
}
