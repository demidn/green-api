"use client";

import { IconButton } from "@/shared/ui/IconButton";
import { SearchInput } from "@/shared/ui/SearchInput";
import { ChatList } from "./ChatList";
import { useChatsStore } from "../../store/use-chats.store";
import { useSetAtom } from "jotai";
import { addChatOpenAtom } from "../../store/ui.atoms";

export function Chats() {
  const { chats, searchQuery, setSearchQuery, isLoading, isFetching, error, refetch } =
    useChatsStore();
  const setAddChatOpen = useSetAtom(addChatOpenAtom);

  return (
    <>
      <header className="shrink-0 px-4 pb-2">
        <div className="flex h-16 items-center justify-between">
          <h1 className="text-heading font-semibold">Чаты</h1>
          <IconButton
            icon="plus"
            label="Новый чат"
            size="small"
            onClick={() => setAddChatOpen(true)}
            className="rounded-full bg-accent text-primary"
          />
        </div>
        <SearchInput value={searchQuery} onChange={setSearchQuery} />
      </header>
      <div
        aria-label="Chat folders preview"
        className="flex h-10 shrink-0 items-stretch gap-6 border-b border-divider px-3 text-message font-medium text-tertiary desktop:hidden"
      >
        <span className="flex items-center border-b-2 border-accent text-accent">Все</span>
      </div>
      {isLoading ? (
        <p role="status" className="px-4 py-6 text-detail text-tertiary">
          Загрузка чатов…
        </p>
      ) : null}
      {error ? (
        <div role="alert" className="px-4 py-6 text-detail text-secondary">
          <p>
            Не удалось загрузить чаты: {error.message}
            {error.status ? ` (${error.status})` : ""}.
          </p>
          <button
            type="button"
            disabled={isFetching}
            onClick={() => void refetch()}
            className="mt-3 rounded-control bg-accent px-4 py-2 text-primary disabled:opacity-50"
          >
            {isFetching ? "Повтор…" : "Повторить"}
          </button>
        </div>
      ) : null}
      {!isLoading && !error && chats.length === 0 ? (
        <p className="px-4 py-6 text-detail text-tertiary">Чатов пока нет.</p>
      ) : null}
      {chats.length > 0 ? <ChatList chats={chats} /> : null}
    </>
  );
}
