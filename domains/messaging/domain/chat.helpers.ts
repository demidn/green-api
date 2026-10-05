import type { Chat } from "./chat";

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function hasMeaningfulName(chat: Chat) {
  const name = chat.name.trim();
  return name.length > 0 && name !== chat.id;
}

function mergeChat(remote: Chat, local?: Chat) {
  if (!local) {
    return remote;
  }
  return {
    ...local,
    ...remote,
    name: hasMeaningfulName(remote) ? remote.name : local.name,
    phoneNumber: remote.phoneNumber ?? local.phoneNumber,
  };
}

export function mergeChats(remoteChats: Chat[], localChats: Chat[]) {
  const remoteById = new Map<string, Chat>();
  for (const chat of remoteChats) {
    remoteById.set(chat.id, chat);
  }
  const localById = new Map(localChats.map((chat) => [chat.id, chat]));
  const merged = [...remoteById.values()].map((chat) => mergeChat(chat, localById.get(chat.id)));
  for (const chat of localById.values()) {
    if (!remoteById.has(chat.id)) {
      merged.push(chat);
    }
  }
  return merged;
}

export function filterChats(chats: Chat[], searchQuery: string) {
  const normalizedNameQuery = searchQuery.trim().toLocaleLowerCase();
  const normalizedPhoneQuery = normalizePhone(searchQuery);
  if (!normalizedNameQuery && !normalizedPhoneQuery) {
    return chats;
  }
  return chats.filter((chat) => {
    const name = chat.name.trim().toLocaleLowerCase();
    const phone = normalizePhone(chat.phoneNumber ?? "");
    return (
      (normalizedNameQuery.length > 0 && name.includes(normalizedNameQuery)) ||
      (normalizedPhoneQuery.length > 0 && phone.includes(normalizedPhoneQuery))
    );
  });
}
