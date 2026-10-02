import { atom } from "jotai";
import { greenApiConfigAtom } from "@/domains/messaging/feature-shared";

export const settingsOpenAtom = atom(false);
export const chatSearchQueryAtom = atom("");
export const localChatsAtom = atom<import("@/domains/messaging/domain").Chat[]>([]);
export const addChatOpenAtom = atom(false);

export type ActiveView = "chats" | "messages";

export const activeViewAtom = atom<ActiveView>("chats");

export const hydratedAtom = atom(false);

export const settingsRequiredAtom = atom((get) => {
  if (!get(hydratedAtom)) {
    return false;
  }
  return get(greenApiConfigAtom) === null;
});

export const showSettingsAtom = atom((get) => {
  if (!get(hydratedAtom)) {
    return false;
  }
  return get(greenApiConfigAtom) === null || get(settingsOpenAtom);
});
