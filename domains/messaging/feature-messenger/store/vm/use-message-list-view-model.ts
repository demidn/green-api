import { useMemo } from "react";
import type { MessageWithStatus } from "@/domains/messaging/domain";

export interface MessageListItemViewModel {
  item: MessageWithStatus;
  joinedBefore: boolean;
  joinedAfter: boolean;
}

export interface MessageGroupViewModel {
  id: string;
  date: string;
  messages: MessageListItemViewModel[];
}

export function useMessageListViewModel(messages: MessageWithStatus[]) {
  return useMemo(() => {
    const groups = new Map<string, MessageGroupViewModel>();
    for (const item of messages) {
      const date = item.message.date;
      const group = groups.get(date) ?? { id: date.toLowerCase(), date, messages: [] };
      const previous = group.messages[group.messages.length - 1];
      group.messages.push({
        item,
        joinedBefore: previous?.item.message.senderId === item.message.senderId,
        joinedAfter: false,
      });
      if (previous) {
        previous.joinedAfter = previous.item.message.senderId === item.message.senderId;
      }
      groups.set(date, group);
    }
    return [...groups.values()];
  }, [messages]);
}
