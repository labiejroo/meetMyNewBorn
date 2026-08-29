"use client";

import { STATUS, rgba } from "@/lib/status";
import { addDays, dayNum, formatRange, monthOf } from "@/lib/dates";
import type { Arrival, Term, WeekendInfo } from "@/lib/types";

interface Props {
  sat: string;
  monthNum: number;
  info: WeekendInfo;
  admin: boolean;
  selected: boolean;
  pickedArrival: Arrival;
  termAt: (day: string) => Term | null;
  onOpen: (sat: string, day: Arrival) => void;
  /** Traktowanie drugiego dnia pary: przygaszony kolor albo delikatna kreskówka. */
  secondDay?: "tint" | "hatch";
}

/**
 * Para weekendowa jako JEDNA pigułka w dwóch ostatnich kolumnach wiersza.
 * Połówka dnia przyjazdu dostaje pełny status, druga — lżejsze traktowanie.
 */
export function WeekendPill({ sat, monthNum, info, admin, selected, pickedArrival, termAt, onOpen, secondDay = "tint" }: Props) {
  const sun = addDays(sat, 1);
  const isFree = info.status === "free";
  const arrival: Arrival = isFree ? pickedArrival : info.arrival ?? null;
  const termSat = termAt(sat);
  const termSun = termAt(sun);
  const base = STATUS[info.status];

  const openable = admin ? info.status !== "past" && info.status !== "holiday" : isFree;
  const label =
    info.status === "holiday"
      ? info.reason?.startsWith("Przerwa świąteczna") ? "Przerwa" : "Święto"
      : base.label;

  const title =
    info.status === "holiday"
      ? `${formatRange(sat, sun)} — niedostępne: ${info.reason}`
      : `${formatRange(sat, sun)} — ${label}${info.guest && (info.visible !== false || admin) ? " · " + info.guest : ""}`;

  function half(day: string, side: "l" | "r") {
    const term = side === "l" ? termSat : termSun;
    const status = term ? term.status : info.status;
    const strong = term ? true : !arrival || arrival === (side === "l" ? "sat" : "sun");
    const s = STATUS[status];
    let background: string;
    if (strong) background = rgba(s.color, 0.34);
    else if (secondDay === "hatch") background = `repeating-linear-gradient(135deg,${rgba(s.color, 0.26)} 0 3px,${rgba(s.color, 0.05)} 3px 8px)`;
    else background = rgba(s.color, 0.09);
    if (status === "holiday") background = rgba(s.color, strong ? 0.2 : 0.09);
    if (status === "past") background = rgba(s.color, 0.18);

    return (
      <div
        onClick={openable ? () => onOpen(sat, side === "l" ? "sat" : "sun") : undefined}
        className={`flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-px transition-colors sm:min-h-[74px] sm:gap-[3px] ${openable ? "cursor-pointer" : ""}`}
        style={{
          background,
          borderRadius: side === "l" ? "11px 0 0 11px" : "0 11px 11px 0",
          boxShadow: term ? `inset 0 0 0 1.5px ${rgba("#C4685C", 0.75)}` : undefined,
        }}
      >
        <span className="text-[13px] font-semibold leading-none tabular-nums sm:text-[15px]" style={{ color: s.ink, opacity: monthOf(day) === monthNum ? 1 : 0.7 }}>
          {dayNum(day)}
        </span>
        <span
          className={`leading-none ${status === "pending" && strong ? "animate-zoia-pulse" : ""}`}
          style={{ color: s.ink, fontSize: s.icon === "•••" ? 8 : 10.5, letterSpacing: s.icon === "•••" ? "-.5px" : undefined }}
        >
          {s.icon}
        </span>
        {info.status !== "past" && (
          <span className="hidden max-w-[96%] overflow-hidden whitespace-nowrap text-[11px] font-semibold uppercase tracking-[.05em] sm:block" style={{ color: s.ink }}>
            {term ? "Termin" : label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      title={title}
      className="col-span-2 col-start-6 flex items-stretch overflow-hidden rounded-xl transition-[filter] hover:brightness-[.975] sm:rounded-2xl"
      style={{
        border:
          info.status === "holiday"
            ? `1.5px dashed ${rgba("#8F8177", 0.7)}`
            : `1.5px solid ${rgba(base.color, info.status === "past" ? 0.3 : 0.55)}`,
        outline: selected ? "2px solid #C98B84" : undefined,
        outlineOffset: 2,
        opacity: info.status === "past" ? 0.55 : 1,
        boxShadow: info.status === "past" ? undefined : "0 1px 2px rgba(61,51,44,.05)",
      }}
    >
      {half(sat, "l")}
      <div className="my-[9px] w-px flex-none" style={{ background: rgba(info.status === "past" ? "#B3A99F" : base.color, 0.4) }} />
      {half(sun, "r")}
    </div>
  );
}
