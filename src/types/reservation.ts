/** Statusy rezerwacji — kontrakt wspólny z backendem. */
export type ReservationStatus =
  | "pending"
  | "booked"
  | "rejected"
  | "cancelled"
  | "blocked"
  | "expired";

/** Dzień przyjazdu. `null` = „jeszcze nie wiem”. */
export type ArrivalDay = "saturday" | "sunday" | null;

/** Kto założył termin — gość przez formularz czy admin ręcznie. */
export type ReservationSource = "guest" | "admin";

export interface Reservation {
  id: string;
  status: ReservationStatus;
  /** Sobota. Dla terminów admina: dowolny dzień początkowy. */
  dateStart: string;
  /** Niedziela. Dla terminów admina: dowolny dzień końcowy. */
  dateEnd: string;
  /** Czy termin to zwykły weekend (sobota + niedziela). */
  isWeekend: boolean;
  guestName: string;
  guestEmail: string;
  arrivalDay: ArrivalDay;
  notes: string | null;
  source: ReservationSource;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationInput {
  /** Sobota wybranego weekendu. */
  dateStart: string;
  /** Niedziela wybranego weekendu. */
  dateEnd: string;
  guestName: string;
  guestEmail: string;
  arrivalDay: ArrivalDay;
  notes?: string;
  /**
   * true = nie pokazuj publicznie, kto przyjedzie. Inni zobaczą sam fakt
   * zajętości terminu. Domyślnie false — gość świadomie zaznacza ukrycie.
   * Nigdy nie dotyczy e-maila ani notatek: te nie są publiczne nigdy.
   */
  isPrivate: boolean;
  /** Token z Cloudflare Turnstile. Na razie placeholder. */
  turnstileToken?: string;
}

/** Odpowiedź po utworzeniu — świadomie bez pełnej rezerwacji. */
export interface CreateReservationResult {
  reservationId: string;
  status: Extract<ReservationStatus, "pending">;
  dateStart: string;
  dateEnd: string;
  /**
   * Link decyzyjny dla rodziców. Produkcyjnie NIE wraca do gościa — mail
   * wysyła backend. Tu jest po to, żeby dało się przejść flow lokalnie.
   */
  decisionUrlForDemo?: string;
  /** Link do odwołania, który gość dostanie mailem. */
  cancelUrlForDemo?: string;
}
