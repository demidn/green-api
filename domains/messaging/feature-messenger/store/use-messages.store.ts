"use client";

import { useAtomValue } from "jotai";
import { useEffect, useMemo } from "react";
import { selectedChatAtom } from "./selected-chat.atom";
import { useOutboxStore } from "./use-outbox.store";
import { useListMessagesSuccessGateway as useListMessagesGateway } from "@/domains/messaging/data-access";
import type { MessageWithStatus } from "@/domains/messaging/domain";
import { wakeOutboxSender } from "./use-outbox-sender";
import { logError } from "@/shared/logger";

export function useMessagesStore() {
  const selectedChat = useAtomValue(selectedChatAtom);
  const query = useListMessagesGateway(selectedChat?.id ?? null);
  const outbox = useOutboxStore();
  const { reconcile } = outbox;
  const chatOutbox = useMemo(
    () => outbox.items.filter((item) => item.chatId === selectedChat?.id),
    [outbox.items, selectedChat?.id],
  );

  useEffect(() => {
    if (!query.data) {
      return;
    }
    void reconcile(new Set(query.data.map((message) => message.id))).catch((error) => {
      logError("Failed to reconcile outbox", error);
    });
  }, [query.data, reconcile]);

  const messages = useMemo(() => {
    const remoteIds = new Set(query.data?.map((message) => message.id));
    const optimistic: MessageWithStatus[] = chatOutbox
      .filter((item) => !item.remoteMessageId || !remoteIds.has(item.remoteMessageId))
      .map((item) => ({
        message: {
          id: item.id,
          senderId: "me",
          text: item.text,
          time: new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          date: "Today",
        },
        localId: item.id,
        status: item.status,
      }));
    return [...(query.data ?? []).map((message) => ({ message })), ...optimistic];
  }, [chatOutbox, query.data]);

  return {
    messages,
    retryMessage: async (id: string) => {
      await outbox.retry(id);
      wakeOutboxSender();
    },
    enqueueMessage: async (text: string) => {
      if (selectedChat) {
        await outbox.enqueue(selectedChat.id, text);
        wakeOutboxSender();
      }
    },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
