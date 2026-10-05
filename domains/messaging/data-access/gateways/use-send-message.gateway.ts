"use client";

import { useCallback } from "react";
import type { GreenApiConfig } from "@/domains/messaging/domain";
import { ApiError } from "../api/api-error";
import { sendMessageApi } from "../api/generated/chats";

export interface SendMessageInput {
  chatId: string;
  message: string;
}

export interface SentMessage {
  id: string;
}

export function useSendMessageGateway(config: GreenApiConfig | null) {
  return useCallback(
    async (input: SendMessageInput, signal?: AbortSignal): Promise<SentMessage> => {
      if (!config) {
        throw new ApiError(0, "Требуется конфигурация API");
      }
      const result = await sendMessageApi(config.idInstance, config.apiTokenInstance, input, {
        apiUrl: config.apiUrl,
        signal,
      });
      return { id: result.idMessage };
    },
    [config],
  );
}
