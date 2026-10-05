import type { OutboxMessageStatus } from "@/domains/messaging/domain";

export type { OutboxMessageStatus } from "@/domains/messaging/domain";

export interface OutboxMessage {
  id: string;
  chatId: string;
  text: string;
  createdAt: number;
  status: OutboxMessageStatus;
  attempts: number;
  nextAttemptAt: number;
  leaseOwner?: string;
  leaseUntil?: number;
  remoteMessageId?: string;
  error?: string;
}
