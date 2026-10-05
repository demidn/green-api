"use client";

import { useMessagingEventsStore } from "./use-messaging-events.store";
import { useNotificationsStore } from "./use-notifications.store";
import { useOutboxSenderStore } from "./use-outbox-sender.store";
import { useOutboxSyncStore } from "./use-outbox-sync.store";

export function useMessengerStore() {
  useMessagingEventsStore();
  useNotificationsStore();
  useOutboxSyncStore();
  useOutboxSenderStore();
}
