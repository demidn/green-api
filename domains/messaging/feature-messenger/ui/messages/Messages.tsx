"use client";

import { useAtomValue } from "jotai";
import { selectedChatAtom } from "../../store/selected-chat.atom";
import { ConversationHeader } from "./ConversationHeader";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";

export function Messages() {
  const selectedChat = useAtomValue(selectedChatAtom);
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-chat">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-chat-pattern mask-[url('/chat-pattern.svg')] mask-repeat mask-center"
      />
      {selectedChat ? (
        <>
          <ConversationHeader />
          <MessageList />
          <MessageComposer />
        </>
      ) : null}
    </div>
  );
}
