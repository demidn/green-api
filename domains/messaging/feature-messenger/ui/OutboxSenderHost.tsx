"use client";

import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { useSendMessageGateway } from "@/domains/messaging/data-access";
import { greenApiConfigAtom } from "@/domains/messaging/feature-shared";
import {
  configureOutboxSender,
  wakeOutboxSender,
  type SenderDependencies,
} from "../store/use-outbox-sender";
import { registerOutboxWake } from "../store/outbox-events";
import { useOutboxStore } from "../store/use-outbox.store";

export function OutboxSenderHost() {
  const config = useAtomValue(greenApiConfigAtom);
  const sendMessage = useSendMessageGateway(config);
  const outbox = useOutboxStore();
  const dependencies = useRef<SenderDependencies | null>(null);

  useEffect(() => {
    dependencies.current = {
      isReady: () => outbox.hydrated && config !== null,
      claimNext: outbox.claimNext,
      getNextWakeAt: outbox.getNextWakeAt,
      sendMessage,
      markAccepted: outbox.markAccepted,
      markRetry: outbox.markRetry,
      markFailed: outbox.markFailed,
    };
  }, [
    config,
    outbox.claimNext,
    outbox.getNextWakeAt,
    outbox.hydrated,
    outbox.markAccepted,
    outbox.markFailed,
    outbox.markRetry,
    sendMessage,
  ]);

  useEffect(() => {
    const stop = configureOutboxSender({
      isReady: () => dependencies.current?.isReady() ?? false,
      claimNext: (...args) => dependencies.current?.claimNext(...args) ?? Promise.resolve(null),
      getNextWakeAt: () => dependencies.current?.getNextWakeAt() ?? Promise.resolve(null),
      sendMessage: (...args) =>
        dependencies.current?.sendMessage(...args) ??
        Promise.reject(new Error("Sender is unavailable")),
      markAccepted: (...args) => dependencies.current?.markAccepted(...args) ?? Promise.resolve(),
      markRetry: (...args) => dependencies.current?.markRetry(...args) ?? Promise.resolve(),
      markFailed: (...args) => dependencies.current?.markFailed(...args) ?? Promise.resolve(),
    });
    const unregister = registerOutboxWake(wakeOutboxSender);
    return () => {
      unregister();
      stop();
    };
  }, []);

  useEffect(() => {
    if (outbox.hydrated && config) {
      wakeOutboxSender();
    }
  }, [config, outbox.hydrated]);

  return null;
}
