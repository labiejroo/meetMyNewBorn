import type { ApiErrorCode } from "@/types";

/**
 * Symulacja błędów API na potrzeby testowania ekranów błędów (§22).
 * Działa jednorazowo: ustawiony kod psuje najbliższą operację i sam się kasuje.
 */
let pending: ApiErrorCode | null = null;

export function setSimulatedFault(code: ApiErrorCode | null) {
  pending = code;
}

export function peekSimulatedFault(): ApiErrorCode | null {
  return pending;
}

export function takeSimulatedFault(): ApiErrorCode | null {
  const code = pending;
  pending = null;
  return code;
}
