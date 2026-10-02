import { ChatListEntry } from "./ChatListEntry";
import type { Chat } from "@/domains/messaging/domain";

interface ChatListProps {
  chats: Chat[];
}

export function ChatList({ chats }: ChatListProps) {
  return (
    <div
      role="region"
      aria-label="Chat list"
      tabIndex={0}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
    >
      <ul>
        {chats.map((chat) => (
          <ChatListEntry key={chat.id} chat={chat} />
        ))}
      </ul>
    </div>
  );
}
