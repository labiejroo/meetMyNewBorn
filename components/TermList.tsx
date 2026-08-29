"use client";

import { useState } from "react";
import { STATUS, arrivalLabel } from "@/lib/status";
import { formatRange } from "@/lib/dates";
import type { Arrival, Term, WeekendInfo } from "@/lib/types";
import { StatusChip } from "./StatusChip";

interface Row { start: string; end: string; info: WeekendInfo; weekend: boolean; sat?: string; term?: Term }

interface Props {
  rows: Row[];
  admin: boolean;
  onOpenWeekend: (sat: string, day: Arrival) => void;
  onOpenTerm: (term: Term) => void;
}

/** Lista pod siatką: na 380 px kratka nie zmieści imienia, więc szczegóły są tutaj. */
export function TermList({ rows, admin, onOpenWeekend, onOpenTerm }: Props) {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, 6);

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3 px-0.5 pt-1">
        <h2 className="m-0 font-serif text-[20px] font-medium tracking-[-0.01em]">Najbliższe terminy</h2>
        <span role="button" tabIndex={0} onClick={() => setAll((v) => !v)} className="cursor-pointer text-[13px] font-medium text-accentHover">
          {all ? "pokaż mniej" : `pokaż wszystkie (${rows.length})`}
        </span>
      </div>

      {shown.map((row) => {
        const i = row.info;
        const s = STATUS[i.status];
        let statusText: string = s.label;
        let detail = "";
        let cta: string | null = null;

        if (i.status === "free") { statusText = "Wolne"; detail = "Można rezerwować"; cta = "Wybierz →"; }
        if (i.status === "pending") { statusText = "Prośba czeka na potwierdzenie gospodarzy"; detail = i.guest ?? ""; }
        if (i.status === "taken") detail = i.visible === false && !admin ? "Zajęte (gość ukrył swoje imię)" : i.guest ?? "";
        if (i.status === "blocked") { statusText = "Zablokowane przez gospodarzy"; detail = i.reason ?? "Termin niedostępny"; }
        if (i.status === "holiday") { statusText = "Niedostępne"; detail = i.reason ?? ""; }
        if (!row.weekend) statusText += " · termin poza weekendem";

        const clickable = admin ? i.status !== "holiday" : i.status === "free";
        const onClick = !clickable ? undefined : row.weekend && row.sat
          ? () => onOpenWeekend(row.sat!, i.arrival ?? null)
          : row.term ? () => onOpenTerm(row.term!) : undefined;

        return (
          <div
            key={row.start + (row.weekend ? "w" : "t")}
            onClick={onClick}
            className={`flex items-start gap-[13px] rounded-2xl border border-line bg-card px-4 py-3.5 transition-colors hover:border-line2 ${clickable ? "cursor-pointer" : ""}`}
          >
            <StatusChip status={i.status} />
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <strong className="text-[14.5px] font-semibold tracking-[-.01em] [text-wrap:pretty]">{formatRange(row.start, row.end)}</strong>
              <span className="text-[12.5px] font-semibold tracking-[.01em]" style={{ color: s.ink }}>{statusText}</span>
              {detail && <span className="break-words text-[13px] leading-snug text-[#6E6259] [text-wrap:pretty]">{detail}</span>}
              {(i.status === "taken" || i.status === "pending") && <span className="text-[12px] text-muted2">{arrivalLabel(i.arrival)}</span>}
            </div>
            {cta && <span className="self-center whitespace-nowrap text-[13px] font-semibold text-accentHover">{cta}</span>}
          </div>
        );
      })}
    </section>
  );
}
