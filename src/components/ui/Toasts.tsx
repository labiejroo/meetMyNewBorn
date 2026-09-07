"use client";

import type { Toast, ToastKind } from "@/hooks/useToasts";
import { rgba } from "@/lib/status";

const KIND: Record<ToastKind, { color: string; ink: string; icon: string }> = {
  success: { color: "#7C9A73", ink: "#3D5A37", icon: "✓" },
  warning: { color: "#D9A441", ink: "#7A5410", icon: "!" },
  error: { color: "#C4685C", ink: "#8A3A31", icon: "!" },
  info: { color: "#8F8177", ink: "#5C5149", icon: "i" },
};

interface Props {
  toasts: Toast[];
  onClose: (id: string) => void;
}

/** Górna krawędź ekranu — na mobile nie zasłaniają przycisku w modalu. */
export function Toasts({ toasts, onClose }: Props) {
  return (
    <div
      className="pointer-events-none fixed inset-x-3.5 top-3.5 z-[80] flex flex-col items-center gap-2.5"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const kind = KIND[toast.kind];
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-[460px] animate-zoia-in items-center gap-3 rounded-[15px] bg-card px-4 py-3.5 shadow-[0_8px_26px_rgba(61,51,44,.14)]"
            style={{ border: `1.5px solid ${rgba(kind.color, 0.6)}` }}
          >
            <span
              aria-hidden
              className="flex h-7 w-7 flex-none items-center justify-center rounded-[9px] text-[13px] font-semibold"
              style={{ background: rgba(kind.color, 0.24), color: kind.ink }}
            >
              {kind.icon}
            </span>
            <span className="flex-1 text-[13.5px] font-medium leading-snug" style={{ color: kind.ink }}>
              {toast.text}
            </span>
            <button
              type="button"
              onClick={() => onClose(toast.id)}
              aria-label="Zamknij powiadomienie"
              className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              style={{ background: rgba(kind.color, 0.14), color: kind.ink }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
