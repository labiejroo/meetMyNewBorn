import type { Reservation, ReservationStatus } from "./reservation";

/**
 * Kłopot z dostarczeniem maila — przychodzi z SES → SNS → lambda feedbacku.
 *
 * DWIE WARTOŚCI, NIE TRZY. Wcześniej było tu „hard" i „soft", bo mock sam
 * wymyślał sobie dane. Prawdziwy backend tego rozróżnienia NIE oddaje do
 * panelu: czy odbicie jest trwałe, czy chwilowe, zostaje w bazie, bo gospodarz
 * w obu przypadkach zrobi dokładnie to samo — zadzwoni. Wariant typu, którego
 * API nie potrafi wypełnić, byłby zaproszeniem do zmyślania w adapterze.
 */
export interface EmailBounce {
  type: "bounce" | "complaint";
  bouncedAt: string;
  /**
   * GOTOWE ZDANIE PO POLSKU, nie komunikat od dostawcy poczty.
   *
   * Backend świadomie nie zwraca kodów SMTP ani `diagnosticCode` — to bywa
   * ciąg w rodzaju „550 5.1.1 <ktos@example.com>: Recipient address rejected",
   * który nie mówi gospodarzowi nic ponad „nie doszło", a przy okazji niesie
   * adres i wygląda jak awaria aplikacji do zgłoszenia komuś.
   */
  reason: string;
}

/** Jedno zdanie na jeden rodzaj kłopotu. Tutaj, bo używają go dwa widoki. */
export const EMAIL_BOUNCE_MESSAGE: Record<EmailBounce["type"], string> = {
  bounce: "Nie udało się dostarczyć wiadomości e-mail.",
  complaint: "Odbiorca oznaczył wiadomość jako spam.",
};

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
  /**
   * Czy którykolwiek mail o tej rezerwacji został POTWIERDZONY jako doręczony.
   *
   * Opcjonalne, bo starszy backend tego nie zwraca, a mocki nie muszą tego
   * udawać. Brak wartości znaczy „nie wiemy" — i tak ma być pokazywany:
   * wtedy nie wyświetlamy nic, a nie „niedostarczono".
   *
   * To NIE jest przeciwieństwo `bounce`. Mail może być ani doręczony, ani
   * odbity — po prostu jeszcze w drodze.
   */
  mailDelivered?: boolean;
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
