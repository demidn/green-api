"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  mergeIncomingMessageIntoHistoryCache,
  readChats,
  upsertChatIntoChatsCache,
} from "@/domains/messaging/data-access";
import { greenApiConfigAtom } from "@/domains/messaging/feature-shared";
import { logError } from "@/shared/logger";
import { localChatsAtom, localChatsHydratedAtom } from "./chats.atom";
import { messagingChannelName, type MessagingEvent } from "./broadcast/messaging";

export function useMessagingEventsStore() {
  const config = useAtomValue(greenApiConfigAtom);
  const queryClient = useQueryClient();
  const setChats = useSetAtom(localChatsAtom);
  const setChatsHydrated = useSetAtom(localChatsHydratedAtom);

  useEffect(() => {
    let active = true;
    const reloadChats = async (initial = false) => {
      try {
        const items = await readChats();
        if (active) {
          setChats(items);
        }
      } catch (error) {
        logError("Failed to reload chats", error);
      } finally {
        if (active && initial) {
          setChatsHydrated(true);
        }
      }
    };

    void reloadChats(true);
    if (typeof BroadcastChannel === "undefined") {
      return () => {
        active = false;
      };
    }
    const channel = new BroadcastChannel(messagingChannelName);
    const listener = (event: MessageEvent<MessagingEvent>) => {
      if (event.data.type === "chats-changed") {
        void reloadChats();
        return;
      }
      if (!config) {
        return;
      }
      if (event.data.type === "incoming-message") {
        mergeIncomingMessageIntoHistoryCache(
          queryClient,
          config,
          event.data.chat.id,
          event.data.message,
          event.data.timestamp,
        );
        upsertChatIntoChatsCache(queryClient, config, event.data.chat);
      }
    };
    channel.addEventListener("message", listener);
    return () => {
      active = false;
      channel.removeEventListener("message", listener);
      channel.close();
    };
  }, [config, queryClient, setChats, setChatsHydrated]);
}
