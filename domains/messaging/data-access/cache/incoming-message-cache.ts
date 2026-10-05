import type { QueryClient } from "@tanstack/react-query";
import type { GreenApiConfig, Message } from "@/domains/messaging/domain";
import type { HistoryMessageDto } from "../api/generated/models";
import { mapIncomingMessageToHistoryDto } from "../mappers/incoming-message-cache.mapper";
import { getChatHistoryQueryKey } from "./query-keys";

export function mergeIncomingMessageIntoHistoryCache(
  queryClient: QueryClient,
  config: GreenApiConfig,
  chatId: string,
  message: Message,
  timestamp: number,
) {
  const queryKey = getChatHistoryQueryKey(config, chatId);
  const current = queryClient.getQueryData<HistoryMessageDto[]>(queryKey);
  if (!current || current.some((item) => item.idMessage === message.id)) {
    return;
  }
  const next = [mapIncomingMessageToHistoryDto(message, chatId, timestamp), ...current];
  next.sort((a, b) => b.timestamp - a.timestamp);
  queryClient.setQueryData(queryKey, next);
}
