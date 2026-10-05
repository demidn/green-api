"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";
import type { Chat } from "@/domains/messaging/domain";
import { greenApiConfigAtom } from "@/domains/messaging/feature-shared";
import {
  useCheckAccountGateway,
  useListChatsGateway,
  writeChat,
} from "@/domains/messaging/data-access";
import { broadcastMessagingEvent } from "./broadcast/messaging";
import { chatSearchQueryAtom } from "./ui.atoms";
import { localChatsAtom, localChatsHydratedAtom } from "./chats.atom";
import { filterChats, mergeChats, normalizePhone } from "@/domains/messaging/domain";

const emptyChats: Chat[] = [];

export function useChatsStore() {
  const config = useAtomValue(greenApiConfigAtom);
  const chatsQuery = useListChatsGateway(config);
  const checkAccount = useCheckAccountGateway(config);
  const localChats = useAtomValue(localChatsAtom);
  const localChatsHydrated = useAtomValue(localChatsHydratedAtom);
  const setLocalChats = useSetAtom(localChatsAtom);
  const [searchQuery, setSearchQuery] = useAtom(chatSearchQueryAtom);
  const mergedChats = useMemo(
    () => mergeChats(chatsQuery.data ?? emptyChats, localChats),
    [chatsQuery.data, localChats],
  );
  const chats = useMemo(() => filterChats(mergedChats, searchQuery), [mergedChats, searchQuery]);
  const isLoading = !localChatsHydrated || (mergedChats.length === 0 && chatsQuery.isLoading);

  const addChatByPhone = async (phoneNumber: string) => {
    const normalizedPhone = normalizePhone(phoneNumber);
    const existing = mergedChats.find(
      (chat) => chat.phoneNumber !== null && normalizePhone(chat.phoneNumber) === normalizedPhone,
    );
    if (existing) {
      return existing;
    }
    const result = await checkAccount(normalizedPhone);
    if (!result.exists) {
      throw new Error("Аккаунт не найден");
    }
    const chat: Chat = {
      id: result.chatId,
      name: normalizedPhone,
      type: "user",
      phoneNumber: normalizedPhone,
    };
    await writeChat(chat);
    setLocalChats((current) => [...current.filter((item) => item.id !== chat.id), chat]);
    broadcastMessagingEvent({ type: "chats-changed" });
    return chat;
  };

  return {
    chats,
    searchQuery,
    setSearchQuery,
    isLoading,
    isFetching: chatsQuery.isFetching,
    error: chatsQuery.error,
    refetch: chatsQuery.refetch,
    addChatByPhone,
  };
}
