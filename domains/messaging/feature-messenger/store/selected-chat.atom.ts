import { atom } from "jotai";
import type { Chat } from "@/domains/messaging/domain";

export const selectedChatAtom = atom<Chat | null>(null);
