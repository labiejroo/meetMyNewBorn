export type Status = "free" | "pending" | "taken" | "blocked" | "holiday" | "past" | "archive";
export type Arrival = "sat" | "sun" | null;

/** Rekord rezerwacji weekendowej, kluczowany datą soboty (ISO yyyy-mm-dd). */
export interface Booking {
  status: Status;
  guest?: string;
  email?: string;
  arrival?: Arrival;
  visible?: boolean;
  reason?: string;
  kind?: string;
}

/** Termin dowolnego zakresu dat, dodany przez gospodarzy (np. święta). */
export interface Term extends Booking {
  id: string;
  start: string;
  end: string;
}

export interface WeekendInfo extends Booking {}

export type ToastKind = "ok" | "warn" | "error";
export interface Toast { id: string; kind: ToastKind; text: string }

export type ResultKind = "confirmed" | "expired" | "cancelled";
export interface ResultState { kind: ResultKind; sat?: string }

export interface FormState {
  email: string;
  guest: string;
  arrival: Arrival;
  visible: boolean;
  status: Status;
}

export interface ModalTarget {
  start: string;
  end: string;
  weekend: boolean;
  sat?: string;
  termId?: string;
}
