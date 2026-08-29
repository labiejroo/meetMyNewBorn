"use client";

import { MAX_MONTH, MIN_MONTH, addDays, monthTitle, monthWeeks, shiftMonth } from "@/lib/dates";
import type { Arrival, Term, WeekendInfo } from "@/lib/types";
import { WeekdayCell } from "./WeekdayCell";
import { WeekendPill } from "./WeekendPill";

const DOW_HEADS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

interface Props {
  month: string;
  setMonth: (m: string) => void;
  admin: boolean;
  pick: { sat: string; arrival: Arrival } | null;
  weekendInfo: (sat: string) => WeekendInfo;
  termAt: (day: string) => Term | null;
  onOpenWeekend: (sat: string, day: Arrival) => void;
  onOpenTerm: (term: Term) => void;
}

export function MonthGrid({ month, setMonth, admin, pick, weekendInfo, termAt, onOpenWeekend, onOpenTerm }: Props) {
  const weeks = monthWeeks(month);
  const monthNum = Number(month.split("-")[1]);
  const atMin = month <= MIN_MONTH;
  const atMax = month >= MAX_MONTH;

  const navClass = (disabled: boolean) =>
    `flex h-11 w-11 flex-none items-center justify-center rounded-2xl pb-[3px] text-[22px] leading-none select-none ${
      disabled ? "cursor-default border border-transparent text-[#D6CCC1]" : "cursor-pointer border border-line bg-cream text-muted"
    }`;

  return (
    <section className="rounded-[22px] border border-line bg-card px-3.5 pb-4 pt-4 shadow-[0_1px_2px_rgba(61,51,44,.03)]">
      <div className="flex items-center justify-between gap-2.5 px-0.5 pb-3.5">
        <div role="button" tabIndex={0} title="Poprzedni miesiąc" className={navClass(atMin)} onClick={atMin ? undefined : () => setMonth(shiftMonth(month, -1))}>‹</div>
        <div className="flex flex-col items-center gap-0.5">
          <h2 className="m-0 font-serif text-[19px] font-medium tracking-[-0.01em] sm:text-[25px]">{monthTitle(month)}</h2>
          <p className="m-0 text-[11px] tracking-[.05em] text-muted2">Rezerwacje do stycznia 2027</p>
        </div>
        <div role="button" tabIndex={0} title="Następny miesiąc" className={navClass(atMax)} onClick={atMax ? undefined : () => setMonth(shiftMonth(month, 1))}>›</div>
      </div>

      <div className="grid grid-cols-7 pb-2">
        {DOW_HEADS.map((d, i) => (
          <span key={d} className={`text-center text-[10.5px] uppercase tracking-[.1em] ${i > 4 ? "font-semibold text-muted" : "text-[#B4A89C]"}`}>{d}</span>
        ))}
      </div>

      {weeks.map((w) => (
        <div key={w.monday} className="mb-[7px] grid grid-cols-7 items-stretch">
          {w.weekdays.map((day) => (
            <WeekdayCell key={day} day={day} monthNum={monthNum} term={termAt(day)} admin={admin} onOpenTerm={onOpenTerm} />
          ))}
          <WeekendPill
            sat={w.saturday}
            monthNum={monthNum}
            info={weekendInfo(w.saturday)}
            admin={admin}
            selected={pick?.sat === w.saturday}
            pickedArrival={pick?.sat === w.saturday ? pick.arrival : null}
            termAt={termAt}
            onOpen={onOpenWeekend}
          />
          <span className="hidden">{addDays(w.saturday, 1)}</span>
        </div>
      ))}

      <p className="m-0 mt-2.5 px-0.5 text-[12px] leading-relaxed text-muted2 [text-wrap:pretty]">
        Weekend to jedna pigułka po prawej stronie tygodnia. Jaśniejsza połowa oznacza dzień, w którym nikt nie przyjeżdża — termin i tak obejmuje oba dni.
      </p>
    </section>
  );
}
