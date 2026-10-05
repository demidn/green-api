"use client";

import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { MessengerLayout } from "@/shared/layout/MessengerLayout";
import { activeViewAtom, hydratedAtom, showSettingsAtom } from "../store/ui.atoms";
import { useMessengerStore } from "../store/use-messenger.store";
import { Chats } from "./chats/Chats";
import { Messages } from "./messages/Messages";
import { SettingsOverlay } from "./settings/SettingsOverlay";
import { Navigation } from "./Navigation";
import { AddChatDialog } from "./chats/AddChatDialog";

export function Messenger() {
  useMessengerStore();
  const activeView = useAtomValue(activeViewAtom);
  const showSettings = useAtomValue(showSettingsAtom);
  const setHydrated = useSetAtom(hydratedAtom);

  useEffect(() => {
    setHydrated(true);
  }, [setHydrated]);

  return (
    <div className="relative" data-view={activeView}>
      <div
        inert={showSettings || undefined}
        aria-hidden={showSettings || undefined}
        className={showSettings ? "pointer-events-none select-none blur-sm" : undefined}
      >
        <MessengerLayout
          navigation={<Navigation />}
          mobileNavigation={<Navigation mobile />}
          sidebar={<Chats />}
          content={<Messages />}
        />
      </div>
      <SettingsOverlay />
      <AddChatDialog />
    </div>
  );
}
