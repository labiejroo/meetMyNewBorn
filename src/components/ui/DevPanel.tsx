"use client";

import { useState } from "react";

import { setSimulatedFault } from "@/mocks/faults";
import { resetDb } from "@/mocks/db";
import { adminApiIsLive, guestApiIsLive } from "@/services/http";
import type { ApiErrorCode } from "@/types";

interface Props {
  onReset: () => void;
}

const FAULTS: { code: ApiErrorCode; label: string }[] = [
  { code: "conflict", label: "409: termin zajęty" },
  { code: "rate_limited", label: "429: za dużo zgłoszeń" },
  { code: "server_error", label: "500: błąd serwera" },
  { code: "not_found", label: "404: nie znaleziono" },
  { code: "offline", label: "brak internetu" },
];

/**
 * Panel do oglądania stanów błędów i resetowania mocków.
 * Znika automatycznie, gdy apka dostanie prawdziwy adres API.
 */
export function DevPanel({ onReset }: Props) {
  const [armed, setArmed] = useState<ApiErrorCode | null>(null);

  // Panel wstrzykuje awarie w warstwę mocków. Gdy gościnna część rozmawia
  // z prawdziwym backendem, nie ma na co wpływać — i nie ma czego pokazywać
  // użytkownikowi na produkcji.
  if (guestApiIsLive || adminApiIsLive) return null;

  function arm(code: ApiErrorCode) {
    const next = armed === code ? null : code;
    setArmed(next);
    setSimulatedFault(next);
  }

  return (
    <section className="flex flex-col gap-2.5 rounded-2xl border border-dashed border-line2 bg-cream px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <strong className="text-[11px] uppercase tracking-[.12em] text-muted">Panel deweloperski</strong>
        <span className="text-[11.5px] text-muted2">
          {armed ? "następna operacja zwróci błąd" : "dane z mocków, bez backendu"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {FAULTS.map((fault) => (
          <button
            key={fault.code}
            type="button"
            aria-pressed={armed === fault.code}
            onClick={() => arm(fault.code)}
            className={`min-h-[44px] rounded-xl border px-3 text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              armed === fault.code
                ? "border-terra bg-[rgba(196,104,92,.14)] text-terraInk"
                : "border-line bg-card text-muted hover:bg-cream2"
            }`}
          >
            {fault.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            resetDb();
            onReset();
          }}
          className="min-h-[44px] rounded-xl border border-line bg-card px-3 text-[12px] font-semibold text-muted transition-colors hover:bg-cream2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Wyczyść dane mocka
        </button>
      </div>
    </section>
  );
}
