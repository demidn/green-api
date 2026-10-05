"use client";

import { useAtomValue } from "jotai";
import { outboxAtom, outboxHydratedAtom } from "./outbox.atom";
import { useOutboxActions } from "./use-outbox-actions";

export function useOutboxStore() {
  const items = useAtomValue(outboxAtom);
  const hydrated = useAtomValue(outboxHydratedAtom);
  return { items, hydrated, ...useOutboxActions() };
}
