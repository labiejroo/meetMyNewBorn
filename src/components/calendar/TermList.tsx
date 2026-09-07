"use client";

import { formatRange } from "@/lib/dates";
import { WEEKEND_STATE, WEEKEND_STATE_HINT, arrivalLabel } from "@/lib/status";
import { StatusChip } from "@/components/ui/StatusChip";
import type { ArrivalDay, CalendarTerm, CalendarWeekend } from "@/types";

interface Props {
  weekends: CalendarWeekend[];
  terms: CalendarTerm[];
  admin: boolean;
  onOpenWeekend: (saturday: string, arrival: ArrivalDay) => void;
  onOpenTerm: (term: CalendarTerm) => void;
}

type Row =
  | { kind: "weekend"; start: string; end: string; weekend: CalendarWeekend }
  | { kind: "term"; start: string; end: string; term: CalendarTerm };

/**
 * Lista pod kalendarzem — dla osób, którym łatwiej czytać wiersze niż siatkę.
 * Świadomie powtarza to, co widać wyżej.
 */
export function TermList({ weekends, terms, admin, onOpenWeekend, onOpenTerm }: Props) {
  const rows: Row[] = [
    ...weekends
      .filter((w) => w.state !== "past")
      .map<Row>((w) => ({ kind: "weekend", start: w.saturday, end: w.sunday, weekend: w })),
    ...terms.map<Row>((t) => ({ kind: "term", start: t.dateStart, end: t.dateEnd, term: t })),
  ].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));

  if (rows.length === 0) return null;

  return (
    <section className="flex flex-col gap-2" aria-label="Lista terminów">
      {rows.slice(0, 14).map((row) => {
        const isWeekend = row.kind === "weekend";
        const state = isWeekend ? row.weekend.state : undefined;
        const status = row.kind === "term" ? row.term.status : undefined;

        const heading = formatRange(row.start, row.end);
        const guestLabel = isWeekend ? row.weekend.guestLabel : row.term.guestLabel;
        const arrival = isWeekend ? row.weekend.arrivalDay : row.term.arrivalDay;

        const detail = isWeekend
          ? row.weekend.state === "free"
            ? "Wolny, możecie go wybrać"
            : (row.weekend.reason ?? WEEKEND_STATE_HINT[row.weekend.state])
          : (row.term.reason ?? "Termin dodany przez gospodarzy");

        const openable = isWeekend
          ? admin
            ? row.weekend.state !== "past" && row.weekend.state !== "holiday"
            : row.weekend.state === "free"
          : admin;

        const onClick = () => {
          if (row.kind === "weekend") onOpenWeekend(row.weekend.saturday, row.weekend.arrivalDay ?? null);
          else onOpenTerm(row.term);
        };

        const body = (
          <>
            <StatusChip state={state} status={status} />
            <span className="flex min-w-0 flex-1 flex-col gap-[3px] text-left">
              <strong className="text-[14px] font-semibold leading-snug [text-wrap:pretty]">{heading}</strong>
              <span className="break-words text-[12.5px] leading-snug text-muted [text-wrap:pretty]">
                {detail}
                {guestLabel ? ` · ${guestLabel}` : ""}
                {guestLabel && arrival !== undefined ? ` · ${arrivalLabel(arrival)}` : ""}
              </span>
            </span>
            {openable && (
              <span
                aria-hidden
                className="flex-none text-[12.5px] font-semibold"
                style={{ color: WEEKEND_STATE[state ?? "free"].ink }}
              >
                {isWeekend && row.weekend.state === "free" ? "wybierz" : "otwórz"}
              </span>
            )}
          </>
        );

        const shared =
          "flex w-full items-center gap-3 rounded-2xl border border-line bg-card px-3.5 py-3 text-left";

        if (!openable) {
          return (
            <div key={`${row.kind}-${row.start}`} className={shared}>
              {body}
            </div>
          );
        }

        return (
          <button
            key={`${row.kind}-${row.start}`}
            type="button"
            onClick={onClick}
            className={`${shared} min-h-[62px] cursor-pointer transition-colors hover:bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
          >
            {body}
          </button>
        );
      })}
    </section>
  );
}
