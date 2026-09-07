"use client";

import { dayNum, formatRange, monthOf, todayIso } from "@/lib/dates";
import { RESERVATION_STATUS, rgba } from "@/lib/status";
import type { CalendarTerm } from "@/types";

interface Props {
  day: string;
  monthNum: number;
  term: CalendarTerm | null;
  admin: boolean;
  onOpenTerm: (term: CalendarTerm) => void;
}

/** Dzień roboczy: cichy numer na tle strony — chyba że gospodarze mają tam termin. */
export function WeekdayCell({ day, monthNum, term, admin, onOpenTerm }: Props) {
  const inMonth = monthOf(day) === monthNum;

  if (!term) {
    return (
      <div className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 sm:min-h-[74px]">
        <span
          className="text-[12.5px] tabular-nums sm:text-[14px]"
          style={{ color: day < todayIso() ? "#D2C8BC" : "#BCB0A4", opacity: inMonth ? 1 : 0.5 }}
        >
          {dayNum(day)}
        </span>
      </div>
    );
  }

  const meta = RESERVATION_STATUS[term.status];
  const first = day === term.dateStart;
  const last = day === term.dateEnd;
  const edge = `1.5px dashed ${rgba(meta.color, 0.8)}`;

  const label = `${formatRange(term.dateStart, term.dateEnd)}: termin gospodarzy${term.guestLabel ? ` · ${term.guestLabel}` : ""}`;

  const style = {
    background: rgba(meta.color, 0.24),
    borderTop: edge,
    borderBottom: edge,
    borderLeft: first ? edge : "none",
    borderRight: last ? edge : "none",
    borderRadius: `${first ? 11 : 0}px ${last ? 11 : 0}px ${last ? 11 : 0}px ${first ? 11 : 0}px`,
  };

  const shared = "flex min-h-[56px] w-full flex-col items-center justify-center gap-px sm:min-h-[74px] sm:gap-[3px]";

  const content = (
    <>
      <span
        className="text-[13px] font-semibold leading-none tabular-nums sm:text-[15px]"
        style={{ color: meta.ink, opacity: inMonth ? 1 : 0.7 }}
      >
        {dayNum(day)}
      </span>
      <span aria-hidden className="text-[10.5px] leading-none sm:text-[12px]" style={{ color: meta.ink }}>
        {meta.icon}
      </span>
    </>
  );

  if (!admin) {
    return (
      <div title={label} className={shared} style={style}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={() => onOpenTerm(term)}
      className={`${shared} cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent`}
      style={style}
    >
      {content}
    </button>
  );
}
