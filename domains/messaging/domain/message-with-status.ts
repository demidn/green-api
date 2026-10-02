import type { Message } from "./message";
import type { OutboxMessageStatus } from "./outbox-message-status";

export interface MessageWithStatus {
  message: Message;
  localId?: string;
  status?: OutboxMessageStatus;
}
