import { atomWithStorage } from "jotai/utils";
import type { GreenApiConfig } from "@/domains/messaging/domain";

export const greenApiConfigAtom = atomWithStorage<GreenApiConfig | null>("green-api-config", null);
