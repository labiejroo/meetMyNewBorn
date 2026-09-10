/**
 * KONTRAKT PRAWDZIWEGO BACKENDU.
 *
 * Celowo osobno od typów mocków. Backend ma własny, węższy słownik statusów
 * (PENDING/CONFIRMED/REJECTED/CANCELLED) i publicznie wypuszcza tylko dwa
 * aktywne — reszta jest historią i nie dotyczy stanu terminu. Frontendowy
 * `ReservationStatus` jest szerszy, bo obejmuje też stany wyliczane lokalnie
 * (`blocked`, `expired`), których baza nie przechowuje.
 *
 * Trzymanie tych dwóch kształtów osobno sprawia, że mapowanie jest widoczne
 * w jednym miejscu, zamiast rozpłynąć się po komponentach.
 */

/** Jedyne statusy, jakie backend pokazuje publicznie — pozostałe zwalniają termin. */
export type ApiReservationStatus = "PENDING" | "CONFIRMED";

export interface ApiPublicReservation {
  status: ApiReservationStatus;
  /**
   * Obecne WYŁĄCZNIE dla CONFIRMED, gdy gość nie ukrył swojej obecności.
   * O tym, czy pole w ogóle wyjdzie, decyduje backend — frontend nie zna
   * i nie potrzebuje znać flagi `isPrivate`.
   */
  guestName?: string;
}

/**
 * Termin zmaterializowany w bazie. Backend zwraca TYLKO takie — brak terminu
 * w odpowiedzi znaczy „zwykły wolny weekend”, a nie „nie wiem”.
 */
export interface ApiVisitSlot {
  id: string;
  dateStart: string;
  dateEnd: string;
  isWeekend: boolean;
  isBlocked: boolean;
  blockedReason: string | null;
  reservation: ApiPublicReservation | null;
}

/** Odpowiedź POST /api/reservations. Świadomie bez danych osobowych. */
export interface CreateReservationApiResponse {
  id: string;
  status: "PENDING";
  slot: { id: string; dateStart: string; dateEnd: string };
  message: string;
}

/**
 * ODPOWIEDŹ PANELU GOSPODARZY.
 *
 * Osobna od publicznej i celowo szersza: backend buduje ją inną allowlistą,
 * więc widać tu e-mail, notatki i `isPrivate`, których widok gościa nie oddaje
 * nigdy. Kształt odwzorowuje dokładnie to, co zwraca API — bez pól, których
 * tam nie ma (`adminNote`, `bounce` istnieją tylko w mockach).
 */
export interface ApiAdminReservation {
  id: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";
  guestName: string;
  guestEmail: string;
  arrivalDay: "saturday" | "sunday" | null;
  notes: string | null;
  /** Prywatna notatka rodzicow. Publiczny ApiVisitSlot jej NIE zawiera. */
  adminNote: string | null;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;

  /**
   * LOSY WYSŁANYCH MAILI.
   *
   * `emailDeliveryWarning` jest niepuste tylko wtedy, gdy coś poszło nie tak:
   * wiadomość się odbiła albo odbiorca zgłosił ją jako spam. Backend NIE
   * przysyła tu identyfikatora wiadomości SES-a, kodu SMTP ani rodzaju
   * niepowodzenia — to zostaje w bazie, bo panel i tak by z tym nic nie zrobił.
   *
   * Pola są OPCJONALNE, bo starsza wersja backendu ich nie zwraca. Adapter ma
   * traktować ich brak jak „nic się nie odbiło" — inaczej panel przestałby
   * działać w oknie między wdrożeniem frontu a wdrożeniem API.
   */
  emailDeliveryWarning?: ApiEmailDeliveryWarning | null;
  emailDeliveries?: ApiEmailDelivery[];
}

export interface ApiEmailDeliveryWarning {
  type: "BOUNCE" | "COMPLAINT";
  /** Typ maila (MailEventType), np. GUEST_CONFIRMED. Bywa pusty. */
  mailType: string | null;
  occurredAt: string | null;
}

export interface ApiEmailDelivery {
  mailType: string | null;
  status: "SENT" | "DELIVERED" | "COMPLAINED" | "BOUNCED";
  occurredAt: string | null;
}

/** Termin widziany przez gospodarzy — z pełną historią, także odrzuconą. */
export interface ApiAdminVisitSlot {
  id: string;
  dateStart: string;
  dateEnd: string;
  isWeekend: boolean;
  isBlocked: boolean;
  blockedReason: string | null;
  createdAt: string;
  updatedAt: string;
  reservations: ApiAdminReservation[];
}

/**
 * DECYZJA Z LINKU W MAILU.
 *
 * Trzecia allowlista backendu, obok publicznej i panelu gospodarzy. Węższa niż
 * ApiAdminReservation: nie ma tu ani `adminNote`, ani `isPrivate`, bo token
 * trzymany w ręku nie może dawać wglądu w prywatne notatki rodziców.
 *
 * Statusu jest tylko jeden, bo tylko prośba czekająca na decyzję ma czynny
 * token — na wszystko inne backend odpowiada tak samo jak na token nieznany.
 */
export interface ApiDecisionPreview {
  reservationId: string;
  guestName: string;
  guestEmail: string;
  dateStart: string;
  dateEnd: string;
  arrivalDay: "saturday" | "sunday" | null;
  notes: string | null;
  status: "PENDING";
}

/** Odpowiedź na POST confirm/reject. Po niej token jest już nieważny. */
export interface ApiDecisionResult {
  status: "CONFIRMED" | "REJECTED";
  message: string;
}
