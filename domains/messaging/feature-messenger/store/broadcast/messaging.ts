import type { Chat, Message } from "@/domains/messaging/domain";
import { logError } from "@/shared/logger";

export const messagingChannelName = "green-api-max-messaging";
export type MessagingEvent =
  | { type: "incoming-message"; message: Message; chat: Chat; timestamp: number }
  | { type: "chats-changed" };

export function broadcastMessagingEvent(event: MessagingEvent) {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(messagingChannelName);
    channel.postMessage(event);
  } catch (error) {
    logError("Failed to broadcast messaging event", error);
  } finally {
    if (channel) {
      try {
        channel.close();
      } catch (error) {
        logError("Failed to close messaging event channel", error);
      }
    }
  }
}
