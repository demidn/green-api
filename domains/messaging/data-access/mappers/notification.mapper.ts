import {
  formatMessageTimestamp,
  type Chat,
  type ChatType,
  type Message,
} from "@/domains/messaging/domain";
import type { NotificationEnvelopeDto } from "../api/generated/models";
import type { NotificationEvent, ReceivedNotification } from "../notification.types";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function mapNotificationEnvelope(dto: NotificationEnvelopeDto): ReceivedNotification {
  const body = record(dto.body);
  const senderData = record(body.senderData);
  const messageData = record(body.messageData);
  const textData = record(messageData.textMessageData);
  const isIncomingText =
    body.typeWebhook === "incomingMessageReceived" && messageData.typeMessage === "textMessage";
  if (
    !isIncomingText ||
    typeof body.idMessage !== "string" ||
    typeof senderData.chatId !== "string" ||
    typeof senderData.sender !== "string" ||
    typeof body.timestamp !== "number" ||
    typeof textData.textMessage !== "string"
  ) {
    return { receiptId: dto.receiptId, event: { type: "ignored" } };
  }
  const chatId = senderData.chatId;
  const timestamp = body.timestamp;
  const timestampParts = formatMessageTimestamp(timestamp);
  const chatType = ["user", "group", "channel", "bot"].includes(String(senderData.chatType))
    ? (String(senderData.chatType) as ChatType)
    : "user";
  const name =
    typeof senderData.chatName === "string"
      ? senderData.chatName
      : chatType === "user" && typeof senderData.senderName === "string"
        ? senderData.senderName
        : chatId;
  const phone =
    chatType !== "user" || senderData.senderPhoneNumber === 0
      ? null
      : typeof senderData.senderPhoneNumber === "number" ||
          typeof senderData.senderPhoneNumber === "string"
        ? String(senderData.senderPhoneNumber)
        : null;
  const message: Message = {
    id: body.idMessage,
    senderId: senderData.sender,
    text: textData.textMessage,
    timestamp: timestamp * 1000,
    time: timestampParts.time,
    date: timestampParts.date,
  };
  const chat: Chat = { id: chatId, name, type: chatType, phoneNumber: phone };
  const event: NotificationEvent = { type: "incoming-message", timestamp, message, chat };
  return { receiptId: dto.receiptId, event };
}
