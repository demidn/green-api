"use client";

import { useAtomValue } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { createNotificationGateway, type NotificationEvent } from "@/domains/messaging/data-access";
import { greenApiConfigAtom } from "@/domains/messaging/feature-shared";
import { hydratedAtom } from "./ui.atoms";
import { notificationProcessorUseCase } from "./usecases/notification-processor.usecase";
import { notificationReceiverUseCase } from "./usecases/notification-receiver.usecase";

export function useNotificationsStore() {
  const config = useAtomValue(greenApiConfigAtom);
  const hydrated = useAtomValue(hydratedAtom);
  const queryClient = useQueryClient();
  const runtime = useMemo(() => {
    if (!config) {
      return null;
    }
    const gateway = createNotificationGateway(config);
    return {
      receive: gateway.receive,
      remove: gateway.remove,
      process: (event: NotificationEvent) =>
        notificationProcessorUseCase.run(queryClient, config, event),
    };
  }, [config, queryClient]);

  useEffect(() => {
    if (!hydrated || !runtime) {
      return;
    }
    return notificationReceiverUseCase.run(runtime);
  }, [hydrated, runtime]);
}
