import type { QueryClient } from "@tanstack/react-query";
import type { GreenApiConfig } from "@/domains/messaging/domain";
import {
  mergeIncomingMessageIntoHistoryCache,
  upsertChatIntoChatsCache,
  type NotificationEvent,
} from "@/domains/messaging/data-access";
import { broadcastMessagingEvent } from "../broadcast/messaging";

export const notificationProcessorUseCase = {
  run: async (queryClient: QueryClient, config: GreenApiConfig, event: NotificationEvent) => {
    if (event.type !== "incoming-message") {
      return;
    }
    mergeIncomingMessageIntoHistoryCache(
      queryClient,
      config,
      event.chat.id,
      event.message,
      event.timestamp,
    );
    upsertChatIntoChatsCache(queryClient, config, event.chat);
    broadcastMessagingEvent({
      type: "incoming-message",
      message: event.message,
      chat: event.chat,
      timestamp: event.timestamp,
    });
  },
};
