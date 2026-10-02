"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import type { Chat } from "@/domains/messaging/domain";
import { greenApiConfigAtom } from "@/domains/messaging/feature-shared";
import { useCheckAccountGateway } from "@/domains/messaging/data-access";
import { writeChat } from "./outbox.db";
import { notifyChatsChanged } from "./chat-events";
// Explicit development selection. Swap only this import for the real or error gateway.
import { useListChatsSuccessGateway as useListChatsGateway } from "@/domains/messaging/data-access";
import { chatSearchQueryAtom, localChatsAtom } from "./ui.atoms";

const emptyChats: Chat[] = [];

export function useChatsStore() {
  const config = useAtomValue(greenApiConfigAtom);
  const query = useListChatsGateway(config);
  const checkAccount = useCheckAccountGateway(config);
  const localChats = useAtomValue(localChatsAtom);
  const setLocalChats = useSetAtom(localChatsAtom);
  const [searchQuery, setSearchQuery] = useAtom(chatSearchQueryAtom);
  const normalizedQuery = searchQuery.toLocaleLowerCase().replace(/[\s()+-]/g, "");
  const merged = new Map<string, Chat>();
  for (const chat of query.data ?? emptyChats) {
    merged.set(chat.id, chat);
  }
  for (const chat of localChats) {
    if (!merged.has(chat.id)) {
      merged.set(chat.id, chat);
    }
  }
  const chats = [...merged.values()].filter((chat) => {
    if (!normalizedQuery) {
      return true;
    }
    const name = chat.name.toLocaleLowerCase();
    const phone = (chat.phoneNumber ?? "").replace(/[\s()+-]/g, "");
    return name.includes(searchQuery.toLocaleLowerCase()) || phone.includes(normalizedQuery);
  });

  return {
    chats,
    searchQuery,
    setSearchQuery,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    addChatByPhone: async (phoneNumber: string) => {
      const normalizedPhone = phoneNumber.replace(/\D/g, "");
      const existing = [...merged.values()].find(
        (chat) => chat.phoneNumber?.replace(/\D/g, "") === normalizedPhone,
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
      notifyChatsChanged();
      return chat;
    },
  };
}
