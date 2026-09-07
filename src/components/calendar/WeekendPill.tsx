"use client";

import { dayNum, formatRange, monthOf } from "@/lib/dates";
import { WEEKEND_STATE, WEEKEND_STATE_HINT, rgba } from "@/lib/status";
import type { ArrivalDay, CalendarTerm, CalendarWeekend, WeekendState } from "@/types";

interface Props {
  weekend: CalendarWeekend;
  monthNum: number;
  admin: boolean;
  selected: boolean;
  pickedArrival: ArrivalDay;
  termAt: (day: string) => CalendarTerm | null;
  onOpen: (saturday: string, arrival: ArrivalDay) => void;
  /** Traktowanie drugiego dnia pary: przygaszony kolor albo delikatna kreskówka. */
  secondDay?: "tint" | "hatch";
}

/**
 * Para weekendowa jako JEDNA pigułka w dwóch ostatnich kolumnach wiersza.
 * Połówka dnia przyjazdu dostaje pełny status, druga — lżejsze traktowanie.
 */
export function WeekendPill({
  weekend, monthNum, admin, selected, pickedArrival, termAt, onOpen, secondDay = "tint",
}: Props) {
  const { saturday, sunday, state } = weekend;
  const isFree = state === "free";
  const arrival: ArrivalDay = isFree ? pickedArrival : weekend.arrivalDay ?? null;
  const termSat = termAt(saturday);
  const termSun = termAt(sunday);
  const base = WEEKEND_STATE[state];

  // Gość klika tylko wolne. Gospodarze także zajęte, oczekujące i zablokowane.
  const openable = admin ? state !== "past" && state !== "holiday" : isFree;

  const label =
    state === "holiday"
      ? weekend.reason?.startsWith("Przerwa świąteczna")
        ? "Przerwa"
        : "Święto"
      : base.label;

  /** Czemu termin jest niedostępny — mówimy wprost, nie zostawiamy zgadywania. */
  const explanation = weekend.reason ?? WEEKEND_STATE_HINT[state];
  const guest = weekend.guestLabel ? ` · ${weekend.guestLabel}` : "";
  const title = `${formatRange(saturday, sunday)}: ${isFree ? "wolny weekend" : explanation}${guest}`;

  function half(day: string, side: "left" | "right") {
    const term = side === "left" ? termSat : termSun;
    const cellState: WeekendState = term ? (term.status as WeekendState) : state;
    const strong = term ? true : !arrival || arrival === (side === "left" ? "saturday" : "sunday");
    const meta = WEEKEND_STATE[cellState] ?? base;

    let background: string;
    if (strong) background = rgba(meta.color, 0.34);
    else if (secondDay === "hatch")
      background = `repeating-linear-gradient(135deg,${rgba(meta.color, 0.26)} 0 3px,${rgba(meta.color, 0.05)} 3px 8px)`;
    else background = rgba(meta.color, 0.09);
    if (cellState === "holiday") background = rgba(meta.color, strong ? 0.2 : 0.09);
    if (cellState === "past") background = rgba(meta.color, 0.18);

    const content = (
      <>
        <span
          className="text-[13px] font-semibold leading-none tabular-nums sm:text-[15px]"
          style={{ color: meta.ink, opacity: monthOf(day) === monthNum ? 1 : 0.7 }}
        >
          {dayNum(day)}
        </span>
        <span
          aria-hidden
          className={`leading-none ${cellState === "pending" && strong ? "animate-zoia-pulse" : ""}`}
          style={{
            color: meta.ink,
            fontSize: meta.icon === "•••" ? 8 : 10.5,
            letterSpacing: meta.icon === "•••" ? "-.5px" : undefined,
          }}
        >
          {meta.icon}
        </span>
        {state !== "past" && (
          <span
            className="hidden max-w-[96%] overflow-hidden whitespace-nowrap text-[11px] font-semibold uppercase tracking-[.05em] sm:block"
            style={{ color: meta.ink }}
          >
            {term ? "Termin" : label}
          </span>
        )}
      </>
    );

    const shared = "flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-px transition-colors sm:min-h-[74px] sm:gap-[3px]";
    const style = {
      background,
      borderRadius: side === "left" ? "11px 0 0 11px" : "0 11px 11px 0",
      boxShadow: term ? `inset 0 0 0 1.5px ${rgba("#C4685C", 0.75)}` : undefined,
    };

    if (!openable) {
      return (
        <div className={shared} style={style}>
          {content}
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onOpen(saturday, side === "left" ? "saturday" : "sunday")}
        aria-label={`${formatRange(saturday, sunday)}: ${isFree ? "wolny, wybierz ten weekend" : explanation}`}
        className={`${shared} cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent`}
        style={style}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      title={title}
      className="col-span-2 col-start-6 flex items-stretch overflow-hidden rounded-xl transition-[filter] hover:brightness-[.975] sm:rounded-2xl"
      style={{
        border:
          state === "holiday"
            ? `1.5px dashed ${rgba("#8F8177", 0.7)}`
            : `1.5px solid ${rgba(base.color, state === "past" ? 0.3 : 0.55)}`,
        outline: selected ? "2px solid #C98B84" : undefined,
        outlineOffset: 2,
        opacity: state === "past" ? 0.55 : 1,
        boxShadow: state === "past" ? undefined : "0 1px 2px rgba(61,51,44,.05)",
      }}
    >
      {half(saturday, "left")}
      <div
        className="my-[9px] w-px flex-none"
        style={{ background: rgba(state === "past" ? "#B3A99F" : base.color, 0.4) }}
      />
      {half(sunday, "right")}
    </div>
  );
}
