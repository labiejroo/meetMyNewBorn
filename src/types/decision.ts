import type { ArrivalDay, ReservationStatus } from "./reservation";

/** Co widzą rodzice po wejściu w link z maila. GET niczego nie zmienia. */
export interface DecisionResponse {
  reservationId: string;
  status: ReservationStatus;
  dateStart: string;
  dateEnd: string;
  guestName: string;
  guestEmail: string;
  arrivalDay: ArrivalDay;
  notes: string | null;
  /** false = decyzja już zapadła, pokazujemy tylko wynik. */
  canDecide: boolean;
  /** Kiedy podjęto decyzję, jeśli była. */
  decidedAt?: string;
}

/** Co widzi gość po wejściu w link do odwołania. GET niczego nie zmienia. */
export interface CancellationResponse {
  reservationId: string;
  status: ReservationStatus;
  dateStart: string;
  dateEnd: string;
  guestName: string;
  arrivalDay: ArrivalDay;
  /** false = już odwołane albo termin minął. */
  canCancel: boolean;
  cancelledAt?: string;
}

export type DecisionOutcome = "accepted" | "rejected";
