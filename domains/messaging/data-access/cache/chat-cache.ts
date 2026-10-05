import type { QueryClient } from "@tanstack/react-query";
import type { Chat, GreenApiConfig } from "@/domains/messaging/domain";
import type { ChatDto } from "../api/generated/models";
import { getChatsQueryKey } from "./query-keys";

function toChatDto(chat: Chat, existing?: ChatDto): ChatDto {
  const incomingPhone = chat.phoneNumber ? Number(chat.phoneNumber) : 0;
  const trimmedName = chat.name.trim();
  const incomingName = trimmedName && trimmedName !== chat.id ? chat.name : undefined;
  return {
    chatId: chat.id,
    name: incomingName ?? existing?.name ?? chat.id,
    type: chat.type === "user" && existing && existing.type !== "user" ? existing.type : chat.type,
    phoneNumber: incomingPhone > 0 ? incomingPhone : (existing?.phoneNumber ?? 0),
  };
}

export function upsertChatIntoChatsCache(
  queryClient: QueryClient,
  config: GreenApiConfig,
  chat: Chat,
) {
  const queryKey = getChatsQueryKey(config);
  const current = queryClient.getQueryData<ChatDto[]>(queryKey);
  if (!current) {
    return;
  }
  const existing = current.find((item) => item.chatId === chat.id);
  const next = toChatDto(chat, existing);
  queryClient.setQueryData(queryKey, [next, ...current.filter((item) => item.chatId !== chat.id)]);
}
