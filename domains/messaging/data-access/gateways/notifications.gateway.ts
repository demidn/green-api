import type { GreenApiConfig } from "@/domains/messaging/domain";
import { deleteNotificationApi, receiveNotificationApi } from "../api/generated/chats";
import type { NotificationEnvelopeDto } from "../api/generated/models";
import { mapNotificationEnvelope } from "../mappers/notification.mapper";
import type { ReceivedNotification } from "../notification.types";

export function createNotificationGateway(config: GreenApiConfig) {
  return {
    receive: async (
      receiveTimeout: number,
      signal: AbortSignal,
    ): Promise<ReceivedNotification | null> => {
      const result: NotificationEnvelopeDto | null = await receiveNotificationApi(
        config.idInstance,
        config.apiTokenInstance,
        { receiveTimeout },
        { apiUrl: config.apiUrl, signal },
      );
      return result ? mapNotificationEnvelope(result) : null;
    },
    remove: async (receiptId: number) => {
      const result = await deleteNotificationApi(
        config.idInstance,
        config.apiTokenInstance,
        receiptId,
        { apiUrl: config.apiUrl },
      );
      if (!result.result) {
        throw new Error(result.reason || "Не удалось удалить уведомление");
      }
    },
  };
}
