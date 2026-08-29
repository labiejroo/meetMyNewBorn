"use client";

import { rgba } from "@/lib/status";
import type { Toast } from "@/lib/types";

const KIND = {
  ok: { color: "#7C9A73", ink: "#3D5A37", icon: "✓" },
  warn: { color: "#D9A441", ink: "#7A5410", icon: "•••" },
  error: { color: "#C4685C", ink: "#8A3A31", icon: "!" },
};

/** Górna krawędź ekranu — na mobile nie zasłaniają przycisku w modalu. */
export function Toasts({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-3.5 top-3.5 z-[80] flex flex-col items-center gap-2.5">
      {toasts.map((t) => {
        const v = KIND[t.kind];
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-[460px] animate-zoia-in items-center gap-3 rounded-[15px] bg-card px-4 py-3.5 shadow-[0_8px_26px_rgba(61,51,44,.14)]"
            style={{ border: `1.5px solid ${rgba(v.color, 0.6)}` }}
          >
            <span
              className="flex h-7 w-7 flex-none items-center justify-center rounded-[9px] font-semibold"
              style={{ background: rgba(v.color, 0.24), color: v.ink, fontSize: v.icon === "•••" ? 9 : 13 }}
            >
              {v.icon}
            </span>
            <span className="flex-1 text-[13.5px] font-medium leading-snug" style={{ color: v.ink }}>{t.text}</span>
            {t.kind === "error" && (
              <span
                role="button"
                tabIndex={0}
                onClick={() => onClose(t.id)}
                className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-[10px] text-[12px]"
                style={{ background: rgba(v.color, 0.14), color: v.ink }}
              >
                ✕
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
