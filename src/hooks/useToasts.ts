"use client";

import { useCallback, useState } from "react";

export type ToastKind = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  kind: ToastKind;
  text: string;
}

/** Błędy zostają na ekranie, dopóki użytkownik ich nie zamknie. */
const AUTO_DISMISS: Record<ToastKind, number | null> = {
  success: 5000,
  info: 5000,
  warning: 7000,
  error: null,
};

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, text: string) => {
      const id = Math.random().toString(36).slice(2, 9);
      setToasts((list) => [...list, { id, kind, text }]);

      const timeout = AUTO_DISMISS[kind];
      if (timeout !== null) window.setTimeout(() => dismiss(id), timeout);
    },
    [dismiss],
  );

  return { toasts, push, dismiss };
}
