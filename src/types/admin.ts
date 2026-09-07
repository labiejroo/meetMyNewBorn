import type { Reservation, ReservationStatus } from "./reservation";

/** Informacja o odbitym mailu — trafi tu z SES → SNS → lambda bounce-handler. */
export interface EmailBounce {
  type: "hard" | "soft" | "complaint";
  bouncedAt: string;
  /** Krótki opis od dostawcy poczty, gotowy do pokazania. */
  reason: string;
}

export interface AdminReservation extends Reservation {
  /**
   * Identyfikator TERMINU z API panelu. Obecny tylko przy prawdziwym backendzie
   * — mocki trzymają wszystko w jednym płaskim rekordzie i nie mają slotów.
   * Pozwala powiązać kliknięcie w kalendarzu (który zna id terminu) z pozycją
   * na liście (która zna id rezerwacji).
   */
  slotId?: string;
  /** Notatka wewnętrzna gospodarzy, niewidoczna dla gościa. */
  adminNote: string | null;
  /** Czy nazwa gościa jest pokazywana innym w kalendarzu. */
  guestVisible: boolean;
  bounce: EmailBounce | null;
  /** Czy rezerwacja jest archiwalna (rejected/cancelled/expired albo minęła). */
  archived: boolean;
}

export interface UpdateReservationInput {
  status?: ReservationStatus;
  dateStart?: string;
  dateEnd?: string;
  guestName?: string;
  guestEmail?: string;
  arrivalDay?: Reservation["arrivalDay"];
  notes?: string | null;
  adminNote?: string | null;
  guestVisible?: boolean;
}

export interface CreateBlockedDateInput {
  dateStart: string;
  dateEnd: string;
  /** Powód pokazywany gościom przy zablokowanym terminie. */
  reason: string;
}

/** Termin zakładany przez admina — dowolny zakres, także dni robocze. */
export interface CreateAdminReservationInput {
  dateStart: string;
  dateEnd: string;
  guestName: string;
  guestEmail: string;
  status: ReservationStatus;
  arrivalDay: Reservation["arrivalDay"];
  notes?: string;
  adminNote?: string;
}

export interface AdminReservationsQuery {
  /** true dołącza rejected / cancelled / expired i terminy z przeszłości. */
  includeArchived?: boolean;
}
