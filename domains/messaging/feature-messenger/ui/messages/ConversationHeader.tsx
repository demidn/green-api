"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { activeViewAtom } from "../../store/ui.atoms";
import { selectedChatAtom } from "../../store/selected-chat.atom";
import { Avatar } from "@/shared/ui/Avatar";
import { IconButton } from "@/shared/ui/IconButton";

export function ConversationHeader() {
  const selectedChat = useAtomValue(selectedChatAtom);
  const setActiveView = useSetAtom(activeViewAtom);
  const setSelectedChat = useSetAtom(selectedChatAtom);
  if (!selectedChat) {
    return null;
  }
  const title = selectedChat.name;
  const subtitle = "был недавно";
  return (
    <header className="relative flex min-h-header shrink-0 items-center gap-2 border-b border-divider bg-surface px-4 py-3">
      <span className="hidden desktop:inline-flex">
        <IconButton icon="back" label="Закрыть чат" onClick={() => setSelectedChat(null)} />
      </span>
      <span className="desktop:hidden">
        <IconButton icon="back" label="Назад к чатам" onClick={() => setActiveView("chats")} />
      </span>
      <Avatar alt={title} size="small" />
      <div className="ml-1 min-w-0 flex-1">
        <h2 className="truncate text-message font-semibold">{title}</h2>
        <p className="truncate text-caption text-tertiary">{subtitle}</p>
      </div>
    </header>
  );
}
