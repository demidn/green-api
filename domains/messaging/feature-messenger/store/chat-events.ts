export const chatsChannelName = "green-api-max-chats";

export function notifyChatsChanged() {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }
  const channel = new BroadcastChannel(chatsChannelName);
  channel.postMessage("changed");
  channel.close();
}
