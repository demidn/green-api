import type { Message } from "@/domains/messaging/domain";
import type { HistoryMessageDto } from "../api/generated/models";

export function mapIncomingMessageToHistoryDto(
  message: Message,
  chatId: string,
  timestamp: number,
): HistoryMessageDto {
  return {
    idMessage: message.id,
    chatId,
    timestamp,
    type: "incomingMessageReceived",
    typeMessage: "incoming",
    senderId: message.senderId,
    textMessage: message.text,
  };
}
