"use client";

import { StatusChip } from "@/components/ui/StatusChip";
import { formatRange } from "@/lib/dates";
import { RESERVATION_STATUS, arrivalLabel } from "@/lib/status";
import type { AdminReservation } from "@/types";

interface Props {
  reservations: AdminReservation[];
  includeArchived: boolean;
  onToggleArchived: (next: boolean) => void;
  onOpen: (reservation: AdminReservation) => void;
}

/**
 * Widok gospodarzy: więcej informacji niż u gościa — status, nazwisko, adres,
 * dzień przyjazdu, notatka i informacja o odbitym mailu.
 */
export function AdminReservationList({ reservations, includeArchived, onToggleArchived, onOpen }: Props) {
  return (
    <section className="flex flex-col gap-3" aria-label="Wszystkie terminy">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-serif text-[21px] font-medium tracking-[-0.01em]">Wszystkie terminy</h2>
        <button
          type="button"
          role="switch"
          aria-checked={includeArchived}
          onClick={() => onToggleArchived(!includeArchived)}
          className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 text-[12.5px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
            includeArchived
              ? "border-[rgba(201,139,132,.6)] bg-[rgba(201,139,132,.16)] text-terraInk"
              : "border-line text-muted hover:bg-cream"
          }`}
        >
          <span
            aria-hidden
            className="flex h-4 w-4 items-center justify-center rounded border text-[10px]"
            style={{
              background: includeArchived ? "#B57169" : "#FFFDFA",
              borderColor: includeArchived ? "#B57169" : "#CFC2B3",
              color: "#FFFDFA",
            }}
          >
            {includeArchived ? "✓" : ""}
          </span>
          Pokaż archiwalne
        </button>
      </div>

      {reservations.length === 0 && (
        <p className="m-0 rounded-2xl border border-dashed border-line2 bg-cream px-4 py-6 text-center text-[14px] text-muted">
          Nie ma tu jeszcze żadnych terminów.
        </p>
      )}

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {reservations.map((reservation) => {
          const meta = RESERVATION_STATUS[reservation.status];
          return (
            <li key={reservation.id}>
              <button
                type="button"
                onClick={() => onOpen(reservation)}
                className={`flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors hover:bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  reservation.archived ? "border-line bg-[#FAF5EE] opacity-80" : "border-line bg-card"
                }`}
              >
                <StatusChip status={reservation.status} />

                <span className="flex min-w-0 flex-1 flex-col gap-[4px]">
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <strong className="text-[14.5px] font-semibold leading-snug">
                      {formatRange(reservation.dateStart, reservation.dateEnd)}
                    </strong>
                    <span className="text-[12px] font-semibold" style={{ color: meta.ink }}>
                      {meta.label}
                    </span>
                    {!reservation.isWeekend && (
                      <span className="text-[11.5px] text-muted2">· poza weekendem</span>
                    )}
                    {reservation.source === "admin" && (
                      <span className="text-[11.5px] text-muted2">· dodane ręcznie</span>
                    )}
                  </span>

                  {reservation.guestName && (
                    <span className="break-words text-[13px] leading-snug text-ink2 [text-wrap:pretty]">
                      {reservation.guestName}
                      {reservation.guestEmail ? ` · ${reservation.guestEmail}` : ""}
                    </span>
                  )}

                  <span className="text-[12.5px] leading-snug text-muted">
                    {arrivalLabel(reservation.arrivalDay)}
                    {reservation.guestVisible ? "" : " · nazwa ukryta"}
                  </span>

                  {reservation.notes && (
                    <span className="break-words text-[12.5px] leading-snug text-muted [text-wrap:pretty]">
                      „{reservation.notes}”
                    </span>
                  )}

                  {reservation.adminNote && (
                    <span className="break-words text-[12.5px] leading-snug text-muted2 [text-wrap:pretty]">
                      Notatka: {reservation.adminNote}
                    </span>
                  )}

                  {reservation.bounce && (
                    <span className="mt-0.5 inline-flex w-fit items-center gap-1.5 rounded-lg border border-[rgba(196,104,92,.5)] bg-[rgba(196,104,92,.10)] px-2 py-1 text-[11.5px] font-semibold text-terraInk">
                      Mail wrócił: {reservation.bounce.reason}
                    </span>
                  )}

                  {/*
                    „Dostarczono" pokazujemy TYLKO gdy dostawca to potwierdził
                    i nie ma żadnego ostrzeżenia.

                    Brak tej plakietki NIE znaczy „nie doszło" — znaczy
                    „jeszcze nie wiemy", a to zupełnie co innego i nie ma
                    powodu tego komunikować. Wygląd stonowany, bo to
                    informacja uspokajająca, nie sprawa wymagająca uwagi.
                  */}
                  {!reservation.bounce && reservation.mailDelivered && (
                    <span className="mt-0.5 inline-flex w-fit items-center gap-1.5 rounded-lg border border-[rgba(0,0,0,.08)] bg-[rgba(0,0,0,.03)] px-2 py-1 text-[11.5px] font-medium text-muted2">
                      Dostarczono
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
