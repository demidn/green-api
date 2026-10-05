"use client";

import { useQuery } from "@tanstack/react-query";
import type { Chat, GreenApiConfig } from "@/domains/messaging/domain";
import { ApiError } from "../../api/api-error";
import type { ListChatsGatewayResult } from "../use-list-chats.gateway";
import { chats } from "./chats";

export function useListChatsSuccessGateway(config?: GreenApiConfig | null): ListChatsGatewayResult {
  void config;
  const query = useQuery<Chat[], ApiError>({
    queryKey: ["messaging", "chats", "mock", "success"],
    queryFn: async () => chats,
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

export function useListChatsNotFoundGateway(
  config?: GreenApiConfig | null,
): ListChatsGatewayResult {
  void config;
  const query = useQuery<Chat[], ApiError>({
    queryKey: ["messaging", "chats", "mock", "404"],
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

export function useListChatsServerErrorGateway(
  config?: GreenApiConfig | null,
): ListChatsGatewayResult {
  void config;
  const query = useQuery<Chat[], ApiError>({
    queryKey: ["messaging", "chats", "mock", "500"],
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
