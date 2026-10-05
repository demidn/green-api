"use client";

import { useState, type FormEvent } from "react";
import { useAtom, useAtomValue } from "jotai";
import { addChatOpenAtom, activeViewAtom } from "../../store/ui.atoms";
import { selectedChatAtom } from "../../store/ui.atoms";
import { useChatsStore } from "../../store/use-chats.store";

export function AddChatDialog() {
  const open = useAtomValue(addChatOpenAtom);
  if (!open) {
    return null;
  }
  return <AddChatDialogContent />;
}

function AddChatDialogContent() {
  const [, setOpen] = useAtom(addChatOpenAtom);
  const [, setSelectedChat] = useAtom(selectedChatAtom);
  const [, setActiveView] = useAtom(activeViewAtom);
  const { addChatByPhone } = useChatsStore();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalized = phone.replace(/\D/g, "");
    if (normalized.length < 8) {
      setError("Введите корректный номер телефона");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const chat = await addChatByPhone(normalized);
      setSelectedChat(chat);
      setActiveView("messages");
      setOpen(false);
      setPhone("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось добавить чат");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-canvas/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-chat-title"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-bubble border border-divider bg-surface p-6 shadow-composer"
      >
        <h2 id="add-chat-title" className="text-heading font-semibold">
          Новый чат
        </h2>
        <p className="mt-2 text-detail text-tertiary">
          Введите номер телефона в международном формате.
        </p>
        <input
          autoFocus
          inputMode="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Номер телефона"
          className="mt-5 h-10 w-full rounded-control border border-divider bg-surface-secondary px-3 outline-none"
        />
        {error ? (
          <p role="alert" className="mt-2 text-detail text-error">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-control px-4 py-2 text-detail text-secondary"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-control bg-accent px-4 py-2 text-detail text-primary disabled:opacity-50"
          >
            {busy ? "Проверка…" : "Продолжить"}
          </button>
        </div>
      </form>
    </div>
  );
}
