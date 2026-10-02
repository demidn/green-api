"use client";

import { useCallback } from "react";

export function useSendMessageSuccessGateway() {
  return useCallback(async () => ({ id: `mock-${Date.now()}` }), []);
}

export function useSendMessageServerErrorGateway() {
  return useCallback(async () => {
    throw new Error("Internal Server Error");
  }, []);
}
