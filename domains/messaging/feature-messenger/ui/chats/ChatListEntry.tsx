"use client";

import { Avatar } from "@/shared/ui/Avatar";
import { useAtom, useSetAtom } from "jotai";
import type { Chat } from "@/domains/messaging/domain";
import { activeViewAtom } from "../../store/ui.atoms";
import { selectedChatAtom } from "../../store/ui.atoms";

interface ChatListEntryProps {
  chat: Chat;
}

export function ChatListEntry({ chat }: ChatListEntryProps) {
  const [selectedChat, setSelectedChat] = useAtom(selectedChatAtom);
  const setActiveView = useSetAtom(activeViewAtom);
  const selected = selectedChat?.id === chat.id;

  return (
    <li>
      <button
        type="button"
        onClick={() => {
          setSelectedChat(chat);
          setActiveView("messages");
        }}
        aria-current={selected ? "true" : undefined}
        className={`flex min-h-chat-row w-full items-center gap-3 px-4 py-[9px] text-left enabled:hover:bg-hover ${selected ? "desktop:bg-selected" : ""}`}
      >
        <Avatar alt={chat.name} />
        <span className="min-w-0 flex-1">
          <span className="truncate text-detail font-medium">{chat.name}</span>
        </span>
      </button>
    </li>
  );
}
