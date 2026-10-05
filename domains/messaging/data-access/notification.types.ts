import type { Chat, Message } from "@/domains/messaging/domain";

export interface IncomingMessageNotification {
  type: "incoming-message";
  timestamp: number;
  message: Message;
  chat: Chat;
}

export interface IgnoredNotification {
  type: "ignored";
}
export type NotificationEvent = IncomingMessageNotification | IgnoredNotification;
export interface ReceivedNotification {
  receiptId: number;
  event: NotificationEvent;
}
