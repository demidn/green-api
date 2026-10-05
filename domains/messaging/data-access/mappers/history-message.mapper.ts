import {
  formatMessageTimestamp,
  type Message,
  type MessageDeliveryStatus,
} from "@/domains/messaging/domain";
import type { HistoryMessageDto } from "../api/generated/models";

function mapDeliveryStatus(status: string): MessageDeliveryStatus | undefined {
  if (status === "sent" || status === "delivered" || status === "read") {
    return status;
  }
  return undefined;
}

export function mapHistoryMessage(dto: HistoryMessageDto & { textMessage: string }): Message {
  const outgoing = dto.type === "outgoing";
  const timestamp = formatMessageTimestamp(dto.timestamp);
  return {
    id: dto.idMessage,
    senderId: dto.senderId ?? (outgoing ? "me" : `unknown:${dto.idMessage}`),
    text: dto.textMessage,
    timestamp: dto.timestamp * 1000,
    time: timestamp.time,
    date: timestamp.date,
    deliveryStatus:
      outgoing && dto.statusMessage
        ? mapDeliveryStatus(dto.statusMessage.toLowerCase())
        : undefined,
  };
}
