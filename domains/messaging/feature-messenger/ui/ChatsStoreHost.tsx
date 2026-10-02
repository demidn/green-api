"use client";

import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { readChats } from "../store/outbox.db";
import { chatsChannelName } from "../store/chat-events";
import { localChatsAtom } from "../store/ui.atoms";
import { logError } from "@/shared/logger";

export function ChatsStoreHost() {
  const setChats = useSetAtom(localChatsAtom);
  useEffect(() => {
    let active = true;
    void readChats()
      .then((items) => {
        if (active) {
          setChats(items);
        }
      })
      .catch((error) => logError("Failed to hydrate chats", error));
    if (typeof BroadcastChannel === "undefined") {
      return () => {
        active = false;
      };
    }
    const channel = new BroadcastChannel(chatsChannelName);
    const reload = () => {
      void readChats()
        .then((items) => {
          if (active) {
            setChats(items);
          }
        })
        .catch((error) => logError("Failed to reload chats", error));
    };
    channel.addEventListener("message", reload);
    return () => {
      active = false;
      channel.removeEventListener("message", reload);
      channel.close();
    };
  }, [setChats]);
  return null;
}
