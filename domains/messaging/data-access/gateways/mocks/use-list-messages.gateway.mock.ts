"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { GreenApiConfig, Message } from "@/domains/messaging/domain";
import { ApiError } from "../../api/api-error";
import { messages } from "./messages";

export type ListMessagesGatewayResult = Pick<
  UseQueryResult<Message[], ApiError>,
  "data" | "error" | "isLoading" | "isFetching" | "refetch"
>;

export function useListMessagesSuccessGateway(
  _config: GreenApiConfig | null,
  chatId: string | null,
): ListMessagesGatewayResult {
  const query = useQuery<Message[], ApiError>({
    queryKey: ["messaging", "messages", "mock", "success", chatId],
    enabled: chatId !== null,
    queryFn: async () => (chatId === "alex" ? [...messages].reverse() : []),
    retry: false,
  });

  return {
    data: query.data,
    error: query.error,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

export function useListMessagesNotFoundGateway(
  _config: GreenApiConfig | null,
  chatId: string | null,
): ListMessagesGatewayResult {
  const query = useQuery<Message[], ApiError>({
    queryKey: ["messaging", "messages", "mock", "404", chatId],
    enabled: chatId !== null,
    queryFn: async () => {
      throw new ApiError(404, "Не найдено");
    },
    retry: false,
  });

  return {
    data: query.data,
    error: query.error,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}

export function useListMessagesServerErrorGateway(
  _config: GreenApiConfig | null,
  chatId: string | null,
): ListMessagesGatewayResult {
  const query = useQuery<Message[], ApiError>({
    queryKey: ["messaging", "messages", "mock", "500", chatId],
    enabled: chatId !== null,
    queryFn: async () => {
      throw new ApiError(500, "Внутренняя ошибка сервера");
    },
    retry: false,
  });

  return {
    data: query.data,
    error: query.error,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
