"use client";

import { useAtomValue } from "jotai";
import { useEffect, useMemo } from "react";
import { selectedChatAtom } from "./ui.atoms";
import { useOutboxStore } from "./use-outbox.store";
import { useListMessagesGateway } from "@/domains/messaging/data-access";
import { greenApiConfigAtom } from "@/domains/messaging/feature-shared";
import {
  formatMessageTimestamp,
  mergeMessagesByTimestamp,
  type MessageWithStatus,
} from "@/domains/messaging/domain";
import { logError } from "@/shared/logger";

export function useMessagesStore() {
  const selectedChat = useAtomValue(selectedChatAtom);
  const config = useAtomValue(greenApiConfigAtom);
  const query = useListMessagesGateway(config, selectedChat?.id ?? null);
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
    const optimistic: MessageWithStatus[] = [...chatOutbox]
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter((item) => !item.remoteMessageId || !remoteIds.has(item.remoteMessageId))
      .map((item) => ({
        message: {
          id: item.id,
          senderId: "me",
          text: item.text,
          timestamp: item.createdAt,
          ...formatMessageTimestamp(new Date(item.createdAt)),
        },
        localId: item.id,
        status: item.status,
      }));
    return mergeMessagesByTimestamp(
      (query.data ?? []).map((message) => ({ message })),
      optimistic,
    );
  }, [chatOutbox, query.data]);

  return {
    messages,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
