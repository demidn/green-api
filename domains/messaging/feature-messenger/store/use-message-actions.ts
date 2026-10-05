"use client";

import { useStore } from "jotai";
import { selectedChatAtom } from "./ui.atoms";
import { useOutboxActions } from "./use-outbox-actions";

export function useMessageActions() {
  const store = useStore();
  const outbox = useOutboxActions();

  return {
    retryMessage: async (id: string) => {
      await outbox.retry(id);
    },
    sendMessage: async (text: string) => {
      const selectedChat = store.get(selectedChatAtom);
      if (!selectedChat) {
        return;
      }
      await outbox.enqueue(selectedChat.id, text);
    },
  };
}
