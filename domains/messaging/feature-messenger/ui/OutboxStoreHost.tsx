"use client";

import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { readOutbox } from "../store/outbox.db";
import { outboxAtom, outboxHydratedAtom } from "../store/outbox.atom";
import { notifyOutboxWake, outboxChannelName } from "../store/outbox-events";
import { logError } from "@/shared/logger";

export function OutboxStoreHost() {
  const setItems = useSetAtom(outboxAtom);
  const setHydrated = useSetAtom(outboxHydratedAtom);

  useEffect(() => {
    let active = true;
    const channel =
      typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(outboxChannelName);
    const reload = () => {
      void readOutbox()
        .then((stored) => {
          if (!active) {
            return;
          }
          setItems(stored);
          notifyOutboxWake();
        })
        .catch((error) => {
          logError("Failed to reload outbox", error);
        });
    };

    void readOutbox()
      .then((stored) => {
        if (!active) {
          return;
        }
        setItems(stored);
        setHydrated(true);
      })
      .catch((error) => {
        logError("Failed to hydrate outbox", error);
      });
    channel?.addEventListener("message", reload);
    return () => {
      active = false;
      channel?.removeEventListener("message", reload);
      channel?.close();
    };
  }, [setHydrated, setItems]);

  return null;
}
