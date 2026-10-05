"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type { GreenApiConfig, Message } from "@/domains/messaging/domain";
import { useGetChatHistoryApi } from "../api/generated/chats";
import { ApiError } from "../api/api-error";
import type { HistoryMessageDto } from "../api/generated/models";
import { mapHistoryMessage } from "../mappers/history-message.mapper";
import { getChatHistoryQueryKey } from "../cache/query-keys";

export type ListMessagesGatewayResult = Pick<
  UseQueryResult<Message[], ApiError>,
  "data" | "error" | "isLoading" | "isFetching" | "refetch"
>;

function selectMessages(dtos: HistoryMessageDto[]): Message[] {
  try {
    return dtos
      .filter(
        (dto): dto is HistoryMessageDto & { textMessage: string } =>
          typeof dto.textMessage === "string",
      )
      .map(mapHistoryMessage);
  } catch {
    throw new ApiError(200, "Некорректный ответ API");
  }
}

export function useListMessagesGateway(
  config: GreenApiConfig | null,
  chatId: string | null,
): ListMessagesGatewayResult {
  const configured = Boolean(
    config?.apiUrl && config.idInstance && config.apiTokenInstance && chatId,
  );
  const query = useGetChatHistoryApi<Message[], ApiError>(
    config?.idInstance ?? "",
    config?.apiTokenInstance ?? "",
    { chatId: chatId ?? "" },
    {
      query: {
        enabled: configured,
        queryKey:
          configured && config && chatId ? getChatHistoryQueryKey(config, chatId) : undefined,
        select: selectMessages,
        retry: false,
      },
      request: { apiUrl: configured ? config?.apiUrl : undefined },
    },
  );
  return {
    data: query.data,
    error: query.error,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
