"use client";

import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { useSendMessageGateway } from "@/domains/messaging/data-access";
import { greenApiConfigAtom } from "@/domains/messaging/feature-shared";
import { outboxHydratedAtom } from "./outbox.atom";
import { outboxSenderUseCase } from "./usecases/outbox-sender.usecase";

export function useOutboxSenderStore() {
  const config = useAtomValue(greenApiConfigAtom);
  const hydrated = useAtomValue(outboxHydratedAtom);
  const sendMessage = useSendMessageGateway(config);

  useEffect(() => {
    if (!hydrated || !config) {
      return;
    }
    return outboxSenderUseCase.run({ sendMessage });
  }, [config, hydrated, sendMessage]);
}
