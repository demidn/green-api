import { useMessagesStore } from "../../store/use-messages.store";
import { useMessageListViewModel } from "../../store/vm/use-message-list-view-model";
import { DateSeparator } from "./DateSeparator";
import { Message } from "./Message";

export function MessageList() {
  const { messages, isLoading, error } = useMessagesStore();
  const groups = useMessageListViewModel(messages);
  return (
    <div
      role="region"
      aria-label="Message history"
      tabIndex={0}
      className="relative flex min-h-0 flex-1 flex-col-reverse overflow-y-auto overscroll-contain"
    >
      <div className="mx-auto flex min-h-full w-full max-w-history shrink-0 flex-col justify-end px-1.5 pb-4 pt-2 desktop:px-4">
        {isLoading ? (
          <p role="status" className="px-4 py-6 text-detail text-tertiary">
            Loading messages…
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="px-4 py-6 text-detail text-secondary">
            Could not load messages: {error.message}.
          </p>
        ) : null}
        {groups.map((group) => (
          <section key={group.id} aria-label={group.date}>
            <DateSeparator label={group.date} />
            <ol>
              {group.messages.map((message) => (
                <Message
                  key={message.item.message.id}
                  item={message.item}
                  joinedBefore={message.joinedBefore}
                  joinedAfter={message.joinedAfter}
                />
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
