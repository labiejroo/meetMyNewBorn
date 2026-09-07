import type { ArrivalDay, ReservationStatus } from "./reservation";

/**
 * Stan kratki w kalendarzu — to jest widok, nie status rezerwacji.
 * `free` i `holiday` nie mają odpowiednika w bazie, a `rejected`/`cancelled`
 * wracają do puli jako `free`.
 */
export type WeekendState = "free" | "pending" | "booked" | "blocked" | "holiday" | "past";

export interface CalendarDay {
  date: string;
  /** Sobota albo niedziela. */
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  /** Czy dzień mieści się w oknie rezerwacyjnym gościa. */
  inBookingRange: boolean;
}

export interface CalendarWeekend {
  /** ISO soboty — identyfikator weekendu w całej apce. */
  saturday: string;
  sunday: string;
  state: WeekendState;
  /** Gotowe do pokazania wyjaśnienie, czemu termin jest niedostępny. */
  reason?: string;
  /** Nazwa gościa, jeśli wolno ją pokazać publicznie. */
  guestLabel?: string;
  arrivalDay?: ArrivalDay;
  reservationId?: string;
}

/** Termin admina o dowolnym zakresie dat (Wigilia, długi weekend, dzień roboczy). */
export interface CalendarTerm {
  reservationId: string;
  dateStart: string;
  dateEnd: string;
  status: ReservationStatus;
  guestLabel?: string;
  arrivalDay?: ArrivalDay;
  reason?: string;
}

export interface CalendarResponse {
  /** Pierwszy dzień, który gość może wybrać. */
  rangeStart: string;
  /** Ostatni dzień okna rezerwacyjnego. */
  rangeEnd: string;
  weekends: CalendarWeekend[];
  terms: CalendarTerm[];
  /** data ISO → nazwa święta */
  holidays: Record<string, string>;
  /** Przerwa świąteczna, w której gość nie rezerwuje. */
  blackout: { start: string; end: string };
}
