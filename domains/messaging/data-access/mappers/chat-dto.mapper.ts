import type { Chat } from "@/domains/messaging/domain";
import type { ChatDto } from "../api/generated/models";

export function mapChatDto(dto: ChatDto): Chat {
  return {
    id: dto.chatId,
    name: dto.name,
    type: dto.type,
    phoneNumber: dto.phoneNumber === 0 ? null : String(dto.phoneNumber),
  };
}
