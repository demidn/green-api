"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useMessagesStore } from "../../store/use-messages.store";
import { IconButton } from "@/shared/ui/IconButton";
import { logError } from "@/shared/logger";

export function MessageComposer() {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const { enqueueMessage } = useMessagesStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
    element.style.overflowY = element.scrollHeight > 160 ? "auto" : "hidden";
  }, [draft]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) {
      return;
    }
    setSending(true);
    try {
      await enqueueMessage(text);
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }
    event.preventDefault();
    void send().catch((error) => logError("Failed to enqueue message", error));
  }

  return (
    <div className="relative mx-auto w-full max-w-composer shrink-0 px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      <div className="flex items-end rounded-bubble bg-surface p-1 shadow-composer">
        <textarea
          ref={textareaRef}
          aria-label="Message draft"
          placeholder="Сообщение"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="my-1 min-h-8 min-w-0 flex-1 resize-none rounded-control border-0 bg-transparent px-3 py-1.5 text-message text-primary outline-none ring-0 placeholder:text-muted focus:border-0 focus:outline-none focus:ring-0 focus-visible:!outline-none"
        />
        {draft.trim() ? (
          <IconButton
            icon="send"
            label="Отправить"
            onClick={() =>
              void send().catch((error) => logError("Failed to enqueue message", error))
            }
            disabled={sending}
            className="text-accent"
          />
        ) : null}
      </div>
    </div>
  );
}
