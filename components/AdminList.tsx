"use client";

import { useState } from "react";
import { STATUS } from "@/lib/status";
import { addDays, formatRange } from "@/lib/dates";
import { ARCHIVE } from "@/lib/seed";
import type { Arrival, Booking, Term } from "@/lib/types";
import { StatusChip } from "./StatusChip";

interface Props {
  bookings: Record<string, Booking>;
  terms: Term[];
  onOpenWeekend: (sat: string, day: Arrival) => void;
  onOpenTerm: (term: Term) => void;
}

/** Na mobile karty, nie tabela. */
export function AdminList({ bookings, terms, onOpenWeekend, onOpenTerm }: Props) {
  const [archive, setArchive] = useState(false);

  type Row = { start: string; end: string; rec: Booking; sat?: string; term?: Term; weekend: boolean; archived?: boolean };
  const rows: Row[] = [
    ...Object.entries(bookings).map(([sat, rec]) => ({ start: sat, end: addDays(sat, 1), rec, sat, weekend: true })),
    ...terms.map((t) => ({ start: t.start, end: t.end, rec: t, term: t, weekend: false })),
    ...(archive ? ARCHIVE.map((a) => ({ start: a.start, end: a.end, rec: a, weekend: false, archived: true })) : []),
  ].sort((a, b) => (a.start < b.start ? -1 : 1));

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3 px-0.5 pt-1">
        <h2 className="m-0 font-serif text-[20px] font-medium tracking-[-0.01em]">Rezerwacje</h2>
        <span role="button" tabIndex={0} onClick={() => setArchive((v) => !v)} className="cursor-pointer text-[13px] font-medium text-accentHover">
          {archive ? "ukryj archiwalne" : "pokaż archiwalne"}
        </span>
      </div>

      {rows.map((row) => {
        const rec = row.rec;
        const s = STATUS[rec.status];
        let statusText = rec.status === "archive" ? rec.kind ?? "Archiwum" : s.label;
        if (rec.status === "pending") statusText = "Prośba — do potwierdzenia przez gospodarzy";
        if (rec.status === "blocked") statusText = `Zablokowane — ${rec.reason ?? "przez gospodarzy"}`;
        if (!row.weekend && !row.archived) statusText += " · poza weekendem";
        const hidden = rec.visible === false;
        const onClick = row.archived ? undefined : row.weekend && row.sat ? () => onOpenWeekend(row.sat!, rec.arrival ?? null) : row.term ? () => onOpenTerm(row.term!) : undefined;

        return (
          <div
            key={row.start + (row.archived ? "a" : row.weekend ? "w" : "t")}
            onClick={onClick}
            className={`flex items-start gap-[13px] rounded-2xl border border-line px-4 py-3.5 transition-colors hover:border-line2 ${
              row.archived ? "bg-[#FAF5EE] opacity-75" : "cursor-pointer bg-card"
            }`}
          >
            <StatusChip status={rec.status} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <strong className="text-[14.5px] font-semibold tracking-[-.01em] [text-wrap:pretty]">{formatRange(row.start, row.end)}</strong>
              <span className="text-[12.5px] font-semibold" style={{ color: s.ink }}>{statusText}</span>
              <span className="break-words text-[13px] leading-snug text-[#6E6259]">{rec.guest ?? "—"}</span>
              <span className="break-words text-[12.5px] text-muted">{rec.email ?? "brak adresu"}</span>
              <div className="mt-0.5 flex flex-wrap gap-x-2.5 gap-y-1.5">
                <span className="rounded-[7px] bg-cream2 px-2 py-[3px] text-[11.5px] text-[#6E6259]">
                  {rec.arrival === "sat" ? "Przyjazd: sobota" : rec.arrival === "sun" ? "Przyjazd: niedziela" : "Przyjazd: nieustalony"}
                </span>
                <span
                  className="rounded-[7px] px-2 py-[3px] text-[11.5px]"
                  style={{ color: hidden ? "#615850" : "#3D5A37", background: hidden ? "rgba(179,169,159,.24)" : "rgba(124,154,115,.20)" }}
                >
                  {hidden ? "Etykieta ukryta — inni widzą „Zajęte”" : "Etykieta widoczna publicznie"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
