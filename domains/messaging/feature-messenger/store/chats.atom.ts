import { atom } from "jotai";
import type { Chat } from "@/domains/messaging/domain";

export const localChatsAtom = atom<Chat[]>([]);
export const localChatsHydratedAtom = atom(false);
