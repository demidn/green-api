import { atom } from "jotai";
import type { OutboxMessage } from "./outbox.types";

export const outboxAtom = atom<OutboxMessage[]>([]);
export const outboxHydratedAtom = atom(false);
