import { atom } from "jotai";
import type { OutboxMessage } from "@/domains/messaging/data-access";

export const outboxAtom = atom<OutboxMessage[]>([]);
export const outboxHydratedAtom = atom(false);
