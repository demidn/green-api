"use client";

import { Icon } from "@/shared/ui/Icon";
import type { MessageWithStatus } from "@/domains/messaging/domain";
import { useMessageActions } from "../../store/use-message-actions";

interface MessageProps {
  item: MessageWithStatus;
  joinedBefore?: boolean;
  joinedAfter?: boolean;
}

export function Message({ item, joinedBefore = false, joinedAfter = false }: MessageProps) {
  const { retryMessage } = useMessageActions();
  const { message, localId, status } = item;
  const own = message.senderId === "me";
  const deliveryStatus = status ?? message.deliveryStatus;
  const corners = own
    ? `${joinedBefore ? "rounded-tr-bubble-corner" : ""} ${joinedAfter ? "rounded-br-bubble-corner" : ""}`
    : `${joinedBefore ? "rounded-tl-bubble-corner" : ""} ${joinedAfter ? "rounded-bl-bubble-corner" : ""}`;

  return (
    <li
      className={`flex flex-col ${own ? "items-end pl-14 desktop:pl-0" : "items-start pr-14 desktop:pr-0"} ${joinedBefore ? "mt-0.5" : "mt-2"}`}
    >
      <div
        className={`relative w-fit min-w-18 max-w-bubble rounded-bubble bg-linear-[239deg] px-2.5 pb-2.5 pt-2 desktop:max-w-[70%] ${corners} ${own ? "from-outgoing-start via-outgoing-mid to-outgoing-end" : "from-incoming-start via-incoming-mid to-incoming-end"}`}
      >
        <span className="sr-only">{own ? "Вы: " : "Контакт: "}</span>
        <p className="whitespace-pre-wrap text-message [overflow-wrap:anywhere]">
          {message.text}
          <span aria-hidden="true" className={`inline-block ${own ? "w-16" : "w-12"}`} />
        </p>
        <span className="absolute bottom-1 right-2.5 flex items-center gap-1 text-caption text-secondary">
          <time>{message.time}</time>
          {own ? (
            <span
              aria-label={
                deliveryStatus === "failed"
                  ? "Ошибка"
                  : deliveryStatus === "pending" || deliveryStatus === "sending"
                    ? "Отправляется"
                    : deliveryStatus === "read"
                      ? "Прочитано"
                      : deliveryStatus === "delivered"
                        ? "Доставлено"
                        : "Отправлено"
              }
              className={deliveryStatus === "failed" ? "text-error" : undefined}
            >
              <Icon
                name={
                  deliveryStatus === "failed"
                    ? "error"
                    : deliveryStatus === "pending" || deliveryStatus === "sending"
                      ? "pending"
                      : deliveryStatus === "read" || deliveryStatus === "delivered"
                        ? "read"
                        : "sent"
                }
                className="size-4"
              />
            </span>
          ) : null}
        </span>
      </div>
      {status === "failed" && localId ? (
        <button
          type="button"
          className="mt-1 text-caption text-accent underline"
          onClick={() => retryMessage(localId)}
        >
          Повторить отправку
        </button>
      ) : null}
    </li>
  );
}
