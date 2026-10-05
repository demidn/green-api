import {
  acquireNotificationLease,
  releaseNotificationLease,
  renewNotificationLease,
  type NotificationEvent,
  type ReceivedNotification,
} from "@/domains/messaging/data-access";
import { logError } from "@/shared/logger";

const receiveTimeout = 20;
const leaseDuration = 45_000;
const leaseRenewal = 10_000;
const leadershipRetryDelay = 4_000;
const emptyReceiveDelay = 350;

export interface NotificationReceiverRuntime {
  receive: (receiveTimeout: number, signal: AbortSignal) => Promise<ReceivedNotification | null>;
  remove: (receiptId: number) => Promise<void>;
  process: (event: NotificationEvent) => Promise<void>;
}

interface LeadershipSession {
  controller: AbortController;
  task: Promise<void> | null;
  releasePromise: Promise<void> | null;
}

function createOwnerId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function schedule(callback: () => void, delay: number, signal: AbortSignal) {
  if (signal.aborted) {
    return;
  }
  const onAbort = () => clearTimeout(timer);
  const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
    signal.removeEventListener("abort", onAbort);
    if (!signal.aborted) {
      callback();
    }
  }, delay);
  signal.addEventListener("abort", onAbort, { once: true });
}

async function processReceivedNotification(
  runtime: NotificationReceiverRuntime,
  received: ReceivedNotification,
) {
  try {
    await runtime.process(received.event);
  } catch (error) {
    logError("Notification processing failed", error);
    throw error;
  }
  try {
    await runtime.remove(received.receiptId);
  } catch (error) {
    logError("Notification acknowledgement failed", error);
    throw error;
  }
}

export const notificationReceiverUseCase = {
  run(runtime: NotificationReceiverRuntime) {
    const ownerId = createOwnerId();
    const receiverController = new AbortController();
    let leadershipSession: LeadershipSession | null = null;

    const scheduleLeadership = (delay: number) =>
      schedule(() => void tryAcquire(), delay, receiverController.signal);
    const scheduleReceive = (delay: number, session: LeadershipSession) =>
      schedule(() => startReceive(session), delay, session.controller.signal);
    const scheduleHeartbeat = (session: LeadershipSession) =>
      schedule(() => void renewLeadership(session), leaseRenewal, session.controller.signal);

    function stopLeadership(session: LeadershipSession) {
      if (session.releasePromise) {
        return session.releasePromise;
      }
      if (leadershipSession === session) {
        leadershipSession = null;
      }
      session.controller.abort();
      session.releasePromise = (async () => {
        try {
          if (session.task) {
            await session.task;
          }
        } finally {
          await releaseNotificationLease(ownerId);
        }
      })();
      return session.releasePromise;
    }

    async function loseLeadership(session: LeadershipSession) {
      if (leadershipSession !== session || receiverController.signal.aborted) {
        return;
      }
      await stopLeadership(session);
      if (!receiverController.signal.aborted) {
        scheduleLeadership(leadershipRetryDelay);
      }
    }

    async function renewLeadership(session: LeadershipSession) {
      if (
        leadershipSession !== session ||
        receiverController.signal.aborted ||
        session.controller.signal.aborted
      ) {
        return;
      }
      try {
        const renewed = await renewNotificationLease(ownerId, leaseDuration);
        if (
          leadershipSession !== session ||
          receiverController.signal.aborted ||
          session.controller.signal.aborted
        ) {
          return;
        }
        if (renewed) {
          scheduleHeartbeat(session);
        } else {
          await loseLeadership(session);
        }
      } catch (error) {
        logError("Notification lease renewal failed", error);
        await loseLeadership(session);
      }
    }

    async function tryAcquire() {
      if (receiverController.signal.aborted || leadershipSession) {
        return;
      }
      try {
        const acquired = await acquireNotificationLease(ownerId, leaseDuration);
        if (receiverController.signal.aborted) {
          if (acquired) {
            await releaseNotificationLease(ownerId);
          }
          return;
        }
        if (!acquired) {
          scheduleLeadership(leadershipRetryDelay);
          return;
        }
        const session: LeadershipSession = {
          controller: new AbortController(),
          task: null,
          releasePromise: null,
        };
        leadershipSession = session;
        scheduleHeartbeat(session);
        startReceive(session);
      } catch (error) {
        if (!receiverController.signal.aborted) {
          logError("Notification lease acquisition failed", error);
          scheduleLeadership(leadershipRetryDelay);
        }
      }
    }

    function startReceive(session: LeadershipSession) {
      if (
        receiverController.signal.aborted ||
        session.controller.signal.aborted ||
        leadershipSession !== session ||
        session.task
      ) {
        return;
      }
      const task = receiveNext(session);
      session.task = task;
      void task
        .finally(() => {
          if (session.task === task) {
            session.task = null;
          }
        })
        .catch(() => undefined);
    }

    async function receiveNext(session: LeadershipSession) {
      if (
        receiverController.signal.aborted ||
        session.controller.signal.aborted ||
        leadershipSession !== session
      ) {
        return;
      }
      let received: ReceivedNotification | null;
      try {
        received = await runtime.receive(receiveTimeout, session.controller.signal);
      } catch (error) {
        if (session.controller.signal.aborted || receiverController.signal.aborted) {
          return;
        }
        logError("Notification receive failed", error);
        scheduleReceive(1_000, session);
        return;
      }
      if (!received) {
        if (!session.controller.signal.aborted && !receiverController.signal.aborted) {
          scheduleReceive(emptyReceiveDelay, session);
        }
        return;
      }
      const processing = processReceivedNotification(runtime, received);
      let processingFailed = false;
      try {
        await processing;
      } catch {
        processingFailed = true;
        if (!session.controller.signal.aborted && !receiverController.signal.aborted) {
          scheduleReceive(1_000, session);
        }
      }
      if (
        !processingFailed &&
        !session.controller.signal.aborted &&
        !receiverController.signal.aborted &&
        leadershipSession === session
      ) {
        scheduleReceive(0, session);
      }
    }

    scheduleLeadership(0);
    return () => {
      if (receiverController.signal.aborted) {
        return;
      }
      receiverController.abort();
      if (leadershipSession) {
        void stopLeadership(leadershipSession).catch((error) =>
          logError("Notification lease release failed", error),
        );
      }
    };
  },
};
