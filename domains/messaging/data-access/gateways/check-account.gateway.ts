"use client";

import { useCallback } from "react";
import type { GreenApiConfig } from "@/domains/messaging/domain";
import { checkAccountApi } from "../api/generated/chats";
import { ApiError } from "../api/api-error";

export interface CheckAccountResult {
  exists: boolean;
  chatId: string;
}

export function useCheckAccountGateway(config: GreenApiConfig | null) {
  return useCallback(
    async (phoneNumber: string): Promise<CheckAccountResult> => {
      if (!config) {
        throw new ApiError(0, "API configuration is required");
      }
      const result = await checkAccountApi(
        config.idInstance,
        config.apiTokenInstance,
        { phoneNumber: Number(phoneNumber) },
        { apiUrl: config.apiUrl },
      );
      return { exists: result.exist, chatId: result.chatId };
    },
    [config],
  );
}
