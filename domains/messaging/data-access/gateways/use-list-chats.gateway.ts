"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type { Chat, GreenApiConfig } from "@/domains/messaging/domain";
import { ApiError } from "../api/api-error";
import { useListChatsApi } from "../api/generated/chats";
import type { ChatDto } from "../api/generated/models";
import { mapChatDto } from "../mappers/chat-dto.mapper";
import { getChatsQueryKey } from "../cache/query-keys";

export type ListChatsGatewayResult = Pick<
  UseQueryResult<Chat[], ApiError>,
  "data" | "error" | "isLoading" | "isFetching" | "refetch"
>;

function selectChats(dtos: ChatDto[]): Chat[] {
  try {
    return dtos.map(mapChatDto);
  } catch {
    throw new ApiError(200, "Некорректный ответ API");
  }
}

export function useListChatsGateway(config?: GreenApiConfig | null): ListChatsGatewayResult {
  const configured = Boolean(config?.apiUrl && config.idInstance && config.apiTokenInstance);
  const query = useListChatsApi<Chat[], ApiError>(
    config?.idInstance ?? "",
    config?.apiTokenInstance ?? "",
    {
      query: {
        // Include the runtime host and credentials: different instances must not share data.
        queryKey: configured && config ? getChatsQueryKey(config) : undefined,
        enabled: configured,
        select: selectChats,
        retry: false,
      },
      // Also guard manual refetch, which bypasses Query's enabled option.
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
