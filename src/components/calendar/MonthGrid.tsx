"use client";

import { addDays, monthTitle, monthWeeks, shiftMonth } from "@/lib/dates";
import type { ArrivalDay, CalendarTerm, CalendarWeekend } from "@/types";

import { WeekdayCell } from "./WeekdayCell";
import { WeekendPill } from "./WeekendPill";

const DOW_HEADS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

interface Props {
  month: string;
  setMonth: (month: string) => void;
  /** Granice okna rezerwacyjnego, w formacie YYYY-MM. */
  minMonth: string;
  maxMonth: string;
  admin: boolean;
  picked: { saturday: string; arrival: ArrivalDay } | null;
  weekendAt: (saturday: string, sunday: string) => CalendarWeekend;
  termAt: (day: string) => CalendarTerm | null;
  onOpenWeekend: (saturday: string, arrival: ArrivalDay) => void;
  onOpenTerm: (term: CalendarTerm) => void;
}

export function MonthGrid({
  month, setMonth, minMonth, maxMonth, admin, picked, weekendAt, termAt, onOpenWeekend, onOpenTerm,
}: Props) {
  const weeks = monthWeeks(month);
  const monthNum = Number(month.split("-")[1]);
  // Admin ogląda też miesiące spoza okna rezerwacyjnego gości.
  const atMin = !admin && month <= minMonth;
  const atMax = !admin && month >= maxMonth;

  const navClass = (disabled: boolean) =>
    `flex h-11 w-11 flex-none items-center justify-center rounded-2xl pb-[3px] text-[22px] leading-none select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
      disabled
        ? "cursor-default border border-transparent text-[#D6CCC1]"
        : "cursor-pointer border border-line bg-cream text-muted hover:bg-cream2"
    }`;

  return (
    <section className="rounded-[22px] border border-line bg-card px-3.5 pb-4 pt-4 shadow-[0_1px_2px_rgba(61,51,44,.03)]">
      <div className="flex items-center justify-between gap-2.5 px-0.5 pb-3.5">
        <button
          type="button"
          aria-label="Poprzedni miesiąc"
          disabled={atMin}
          className={navClass(atMin)}
          onClick={() => setMonth(shiftMonth(month, -1))}
        >
          ‹
        </button>

        <div className="flex flex-col items-center gap-0.5">
          <h2 aria-live="polite" className="m-0 font-serif text-[19px] font-medium tracking-[-0.01em] sm:text-[25px]">
            {monthTitle(month)}
          </h2>
          <p className="m-0 text-[11px] tracking-[.05em] text-muted2">Rezerwacje do stycznia 2027</p>
        </div>

        <button
          type="button"
          aria-label="Następny miesiąc"
          disabled={atMax}
          className={navClass(atMax)}
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 pb-2" aria-hidden>
        {DOW_HEADS.map((day, index) => (
          <span
            key={day}
            className={`text-center text-[10.5px] uppercase tracking-[.1em] ${index > 4 ? "font-semibold text-muted" : "text-[#B4A89C]"}`}
          >
            {day}
          </span>
        ))}
      </div>

      {weeks.map((week) => (
        <div key={week.monday} className="mb-[7px] grid grid-cols-7 items-stretch">
          {week.weekdays.map((day) => (
            <WeekdayCell
              key={day}
              day={day}
              monthNum={monthNum}
              term={termAt(day)}
              admin={admin}
              onOpenTerm={onOpenTerm}
            />
          ))}
          <WeekendPill
            weekend={weekendAt(week.saturday, addDays(week.saturday, 1))}
            monthNum={monthNum}
            admin={admin}
            selected={picked?.saturday === week.saturday}
            pickedArrival={picked?.saturday === week.saturday ? picked.arrival : null}
            termAt={termAt}
            onOpen={onOpenWeekend}
          />
        </div>
      ))}

      <p className="m-0 mt-2.5 px-0.5 text-[12px] leading-relaxed text-muted2 [text-wrap:pretty]">
        Weekend to jedna pigułka po prawej stronie tygodnia. Jaśniejsza połowa oznacza dzień,
        w którym nikt nie przyjeżdża. Termin i tak obejmuje oba dni.
      </p>
    </section>
  );
}
