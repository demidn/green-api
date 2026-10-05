import type { GreenApiConfig } from "@/domains/messaging/domain";

export function getChatsQueryKey(config: GreenApiConfig) {
  return ["messaging", "chats", config.apiUrl, config.idInstance, config.apiTokenInstance] as const;
}

export function getChatHistoryQueryKey(config: GreenApiConfig, chatId: string) {
  return [
    "messaging",
    "chat-history",
    config.apiUrl,
    config.idInstance,
    config.apiTokenInstance,
    chatId,
  ] as const;
}
