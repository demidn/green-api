"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { settingsOpenAtom, settingsRequiredAtom, showSettingsAtom } from "../../store/ui.atoms";
import { GreenApiConfigForm } from "./GreenApiConfigForm";

export function SettingsOverlay() {
  const showSettings = useAtomValue(showSettingsAtom);
  const settingsRequired = useAtomValue(settingsRequiredAtom);
  const setSettingsOpen = useSetAtom(settingsOpenAtom);

  if (!showSettings) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-canvas/60 p-4" role="presentation">
      <div className="flex min-h-full items-center justify-center">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="messenger-settings-title"
          className="w-full max-w-md rounded-bubble border border-divider bg-surface p-6 shadow-composer"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 id="messenger-settings-title" className="text-heading font-semibold">
                Подключить GREEN-API
              </h1>
              <p className="mt-2 text-detail text-tertiary">
                Введите настройки экземпляра GREEN-API для работы с мессенджером.
              </p>
            </div>
            {!settingsRequired ? (
              <button
                type="button"
                aria-label="Закрыть настройки"
                onClick={() => setSettingsOpen(false)}
                className="text-detail text-tertiary hover:text-primary"
              >
                Закрыть
              </button>
            ) : null}
          </div>
          <GreenApiConfigForm />
        </section>
      </div>
    </div>
  );
}
