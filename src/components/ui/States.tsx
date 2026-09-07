"use client";

import type { ReactNode } from "react";

import { Button } from "./Button";

/** Nigdy nie zostawiamy pustego ekranu — zawsze wiadomo, że coś się dzieje. */
export function LoadingState({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-card px-6 py-10 text-center"
    >
      <span
        aria-hidden
        className="h-6 w-6 animate-spin rounded-full border-2 border-line2 border-t-accent"
      />
      <span className="text-[14.5px] font-medium text-muted">{label}</span>
    </div>
  );
}

interface ErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  children?: ReactNode;
}

/** Użytkownik dostaje zdanie po polsku i przycisk, nigdy stack trace. */
export function ErrorState({ title = "Nie udało się", message, onRetry, retrying, children }: ErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-2xl border border-[rgba(196,104,92,.45)] bg-[rgba(196,104,92,.09)] px-5 py-5"
    >
      <strong className="text-[15px] font-semibold text-terraInk">{title}</strong>
      <p className="m-0 max-w-[52ch] text-[14px] leading-relaxed text-ink2 [text-wrap:pretty]">{message}</p>
      {children}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} loading={retrying} loadingLabel="Ładowanie…">
          Spróbuj ponownie
        </Button>
      )}
    </div>
  );
}

/** Duży komunikat końcowy — po decyzji, odwołaniu, wysłaniu zgłoszenia. */
export function ResultPanel({
  tone,
  eyebrow,
  title,
  children,
}: {
  tone: "success" | "neutral" | "warning";
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  const TONES = {
    success: "border-[rgba(124,154,115,.5)] bg-[rgba(124,154,115,.10)]",
    neutral: "border-line bg-card",
    warning: "border-[rgba(217,164,65,.55)] bg-[rgba(217,164,65,.12)]",
  } as const;

  return (
    <section className={`flex flex-col gap-3.5 rounded-[22px] border px-5 py-6 sm:px-7 sm:py-8 ${TONES[tone]}`}>
      {eyebrow && (
        <span className="text-[11px] uppercase tracking-[.16em] text-muted">{eyebrow}</span>
      )}
      <h1 className="m-0 font-serif text-[24px] font-medium leading-[1.15] tracking-[-0.01em] [text-wrap:pretty] sm:text-[32px]">
        {title}
      </h1>
      {children}
    </section>
  );
}
