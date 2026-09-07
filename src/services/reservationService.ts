import {
  BLACKOUT_END, BLACKOUT_START, BOOKING_RANGE_END, HOLIDAYS,
  addDays, inBlackout, nextSaturday, todayIso,
} from "@/lib/dates";
import { mutateDb, newId, readDb, type MockDb } from "@/mocks/db";
import type {
  AdminReservation, ApiVisitSlot, CalendarResponse, CalendarTerm, CalendarWeekend,
  CancellationResponse, CreateReservationApiResponse, CreateReservationInput,
  CreateReservationResult, ReservationStatus, WeekendState,
} from "@/types";

import { apiError, guestApiIsLive, mockCall, request, usingMocks } from "./http";

/** Statusy, które faktycznie blokują weekend w kalendarzu. */
const OCCUPYING = new Set(["pending", "booked", "blocked"]);

function weekendState(
  reservation: AdminReservation | undefined,
  saturday: string,
  sunday: string,
): CalendarWeekend {
  if (reservation) {
    return {
      saturday,
      sunday,
      state: reservation.status as WeekendState,
      reservationId: reservation.id,
      arrivalDay: reservation.arrivalDay,
      reason: reservation.status === "blocked"
        ? (reservation.adminNote ?? "Termin zablokowany przez gospodarzy")
        : undefined,
      // Nazwę pokazujemy tylko wtedy, gdy gość na to pozwolił.
      guestLabel: reservation.guestVisible && reservation.guestName ? reservation.guestName : undefined,
    };
  }

  return unoccupiedWeekendState(saturday, sunday);
}

/**
 * Stan weekendu, którego NIC nie zajmuje: święto, przerwa świąteczna,
 * przeszłość albo po prostu wolne.
 *
 * Wspólne dla mocków i prawdziwego API — reguły kalendarza są te same
 * niezależnie od tego, skąd przyszły dane o zajętości.
 */
function unoccupiedWeekendState(saturday: string, sunday: string): CalendarWeekend {
  const base = { saturday, sunday };

  if (inBlackout(saturday) || inBlackout(sunday)) {
    const holiday = HOLIDAYS[saturday] ?? HOLIDAYS[sunday];
    return {
      ...base,
      state: "holiday",
      reason: holiday ? `Przerwa świąteczna · ${holiday}` : "Przerwa świąteczna",
    };
  }

  const holiday = HOLIDAYS[saturday] ?? HOLIDAYS[sunday];
  if (holiday) return { ...base, state: "holiday", reason: holiday };

  // Weekend przestaje być do wzięcia w chwili, gdy się zaczął — ta sama granica,
  // której pilnuje walidacja w createReservation. Inaczej w sobotę i niedzielę
  // kalendarz oferowałby termin, który serwis i tak odrzuci.
  if (saturday < todayIso()) return { ...base, state: "past" };

  return { ...base, state: "free" };
}

function buildCalendar(db: MockDb): CalendarResponse {
  const today = todayIso();
  const weekends: CalendarWeekend[] = [];

  // Zaczynamy dwa tygodnie wstecz, żeby w widoku miesiąca było widać także
  // terminy, które właśnie minęły — kalendarz nie urywa się w połowie.
  let saturday = addDays(nextSaturday(today), -14);
  while (saturday <= BOOKING_RANGE_END) {
    const sunday = addDays(saturday, 1);
    const reservation = db.reservations.find(
      (r) => r.isWeekend && r.dateStart === saturday && OCCUPYING.has(r.status),
    );
    weekends.push(weekendState(reservation, saturday, sunday));
    saturday = addDays(saturday, 7);
  }

  const terms: CalendarTerm[] = db.reservations
    .filter((r) => !r.isWeekend && OCCUPYING.has(r.status))
    .map((r) => ({
      reservationId: r.id,
      dateStart: r.dateStart,
      dateEnd: r.dateEnd,
      status: r.status,
      arrivalDay: r.arrivalDay,
      guestLabel: r.guestVisible && r.guestName ? r.guestName : undefined,
      reason: r.status === "blocked" ? (r.adminNote ?? "Termin zablokowany przez gospodarzy") : undefined,
    }));

  return {
    rangeStart: today,
    rangeEnd: BOOKING_RANGE_END,
    weekends,
    terms,
    holidays: HOLIDAYS,
    blackout: { start: BLACKOUT_START, end: BLACKOUT_END },
  };
}

/**
 * MAPOWANIE BACKENDU NA SŁOWNIK KALENDARZA.
 *
 *   isBlocked                 → blocked   (blokada to cecha TERMINU, nie rezerwacji)
 *   reservation CONFIRMED     → booked
 *   reservation PENDING       → pending
 *   brak terminu w odpowiedzi → free / holiday / past
 *
 * REJECTED i CANCELLED tu nie występują: backend nie wypuszcza ich jako
 * aktywnych, więc termin po odmowie wygląda po prostu na wolny.
 */
function weekendStateFromSlot(
  slot: ApiVisitSlot | undefined,
  saturday: string,
  sunday: string,
): CalendarWeekend {
  if (slot?.isBlocked) {
    return {
      saturday,
      sunday,
      state: "blocked",
      reservationId: slot.id,
      reason: slot.blockedReason ?? "Termin zablokowany przez gospodarzy",
    };
  }

  if (slot?.reservation) {
    return {
      saturday,
      sunday,
      state: slot.reservation.status === "CONFIRMED" ? "booked" : "pending",
      reservationId: slot.id,
      // guestName przychodzi WYŁĄCZNIE dla potwierdzonej rezerwacji, której
      // gość nie ukrył. Decyduje o tym backend — przy PENDING pola po prostu
      // nie ma, więc nie da się tu przypadkiem ujawnić, kto poprosił o termin.
      guestLabel: slot.reservation.guestName,
    };
  }

  return unoccupiedWeekendState(saturday, sunday);
}

/** Termin o nietypowym zakresie: Wigilia, długi weekend, dzień roboczy. */
function slotToTerm(slot: ApiVisitSlot): CalendarTerm {
  const status: ReservationStatus = slot.isBlocked
    ? "blocked"
    : slot.reservation?.status === "CONFIRMED"
      ? "booked"
      : "pending";

  return {
    reservationId: slot.id,
    dateStart: slot.dateStart,
    dateEnd: slot.dateEnd,
    status,
    guestLabel: slot.reservation?.guestName,
    reason: slot.isBlocked
      ? (slot.blockedReason ?? "Termin zablokowany przez gospodarzy")
      : undefined,
  };
}

/**
 * KALENDARZ NADAL POWSTAJE TUTAJ, NIE W BACKENDZIE.
 *
 * Backend zwraca wyłącznie terminy ZMATERIALIZOWANE — przy dwunastu weekendach
 * w oknie potrafi oddać trzy. Siatkę weekendów generujemy lokalnie dokładnie
 * tak jak dotąd, a odpowiedź API tylko na nią NAKŁADAMY. Brak terminu
 * w odpowiedzi znaczy „zwykły wolny weekend”.
 *
 * Błąd sieci celowo leci wyżej, na ekran błędu. Zwrócenie pustej listy byłoby
 * groźne: awaria API wyglądałaby wtedy jak „wszystkie terminy wolne”, a gość
 * próbowałby rezerwować zajęte weekendy.
 */
async function fetchCalendar(): Promise<CalendarResponse> {
  const today = todayIso();
  // Dwa tygodnie wstecz, żeby w widoku miesiąca było widać także terminy,
  // które właśnie minęły — kalendarz nie urywa się w połowie.
  const firstSaturday = addDays(nextSaturday(today), -14);

  const slots = await request<ApiVisitSlot[]>(
    `/api/visit-slots?from=${encodeURIComponent(firstSaturday)}&to=${encodeURIComponent(BOOKING_RANGE_END)}`,
  );

  const bySaturday = new Map<string, ApiVisitSlot>();
  slots.filter((slot) => slot.isWeekend).forEach((slot) => bySaturday.set(slot.dateStart, slot));

  const weekends: CalendarWeekend[] = [];
  let saturday = firstSaturday;
  while (saturday <= BOOKING_RANGE_END) {
    weekends.push(weekendStateFromSlot(bySaturday.get(saturday), saturday, addDays(saturday, 1)));
    saturday = addDays(saturday, 7);
  }

  const terms = slots
    .filter((slot) => !slot.isWeekend && (slot.isBlocked || slot.reservation))
    .map(slotToTerm);

  return {
    rangeStart: today,
    rangeEnd: BOOKING_RANGE_END,
    weekends,
    terms,
    holidays: HOLIDAYS,
    blackout: { start: BLACKOUT_START, end: BLACKOUT_END },
  };
}

export async function getCalendar(): Promise<CalendarResponse> {
  if (guestApiIsLive) return fetchCalendar();
  return mockCall(() => buildCalendar(readDb()), 520);
}

/**
 * KALENDARZ GOSPODARZY — z danych, które panel i tak już pobrał.
 *
 * Nie odpytujemy publicznego endpointu: on maskuje nazwiska przy PENDING
 * i przy ukrytych rezerwacjach, a rodzice muszą wiedzieć, czyją prośbę
 * potwierdzają. Nie robimy też drugiego żądania do API panelu — lista
 * i kalendarz opisują ten sam stan, więc dzielą jedno pobranie.
 *
 * Różnica wobec widoku gościa jest jedna i celowa: `guestLabel` pokazujemy
 * ZAWSZE, niezależnie od statusu i od `isPrivate`. Prywatność chroni gościa
 * przed innymi gośćmi, nie przed gospodarzami.
 */
export function buildAdminCalendar(rows: AdminReservation[]): CalendarResponse {
  const today = todayIso();
  const firstSaturday = addDays(nextSaturday(today), -14);

  const occupying = rows.filter((row) => OCCUPYING.has(row.status));

  const weekends: CalendarWeekend[] = [];
  let saturday = firstSaturday;
  while (saturday <= BOOKING_RANGE_END) {
    const sunday = addDays(saturday, 1);
    const row = occupying.find((r) => r.isWeekend && r.dateStart === saturday);

    weekends.push(
      row
        ? {
            saturday,
            sunday,
            state: row.status as WeekendState,
            reservationId: row.id,
            arrivalDay: row.arrivalDay,
            reason:
              row.status === "blocked"
                ? (row.adminNote ?? "Termin zablokowany przez gospodarzy")
                : undefined,
            guestLabel: row.guestName || undefined,
          }
        : unoccupiedWeekendState(saturday, sunday),
    );
    saturday = addDays(saturday, 7);
  }

  const terms: CalendarTerm[] = occupying
    .filter((row) => !row.isWeekend)
    .map((row) => ({
      reservationId: row.id,
      dateStart: row.dateStart,
      dateEnd: row.dateEnd,
      status: row.status,
      arrivalDay: row.arrivalDay,
      guestLabel: row.guestName || undefined,
      reason:
        row.status === "blocked"
          ? (row.adminNote ?? "Termin zablokowany przez gospodarzy")
          : undefined,
    }));

  return {
    rangeStart: today,
    rangeEnd: BOOKING_RANGE_END,
    weekends,
    terms,
    holidays: HOLIDAYS,
    blackout: { start: BLACKOUT_START, end: BLACKOUT_END },
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Walidacja po stronie klienta — wspólna dla mocków i prawdziwego backendu.
 *
 * DLACZEGO NIE WYSTARCZY BACKEND
 * Backend sprawdza to samo jeszcze raz i to on jest ostatecznym strażnikiem.
 * Ale bez tej warstwy użytkownik dowiaduje się o literówce w adresie dopiero
 * po podróży do Lambdy — i to komunikatem ogólnym. NestJS zwraca błędy
 * walidacji jako TABLICĘ technicznych zdań, więc nie da się ich przypiąć do
 * konkretnych pól formularza. Tutaj wskazujemy pole po polu i natychmiast.
 *
 * Rzucamy ApiError z `fields`, bo dokładnie tego kształtu szuka BookingModal,
 * żeby podświetlić właściwy input zamiast wyrzucić toast.
 */
function validateInput(input: CreateReservationInput): void {
  const fields: Record<string, string> = {};

  if (!input.guestName.trim()) fields.guestName = "Napiszcie, kto przyjedzie.";
  if (!EMAIL_RE.test(input.guestEmail.trim())) fields.guestEmail = "Ten adres wygląda na niepełny.";

  if (Object.keys(fields).length > 0) {
    throw apiError("bad_request", "Sprawdźcie, proszę, zaznaczone pola.", fields);
  }

  if (input.dateStart < todayIso() || input.dateEnd > BOOKING_RANGE_END) {
    throw apiError("bad_request", "Ten termin jest poza okresem, który można rezerwować.");
  }
}

export async function createReservation(
  input: CreateReservationInput,
): Promise<CreateReservationResult> {
  // PRZED wysyłką i niezależnie od tego, czy po drugiej stronie jest prawdziwy
  // backend, czy mocki. Wcześniej ta walidacja siedziała w gałęzi mocków, więc
  // po podłączeniu API przestała się wykonywać.
  validateInput(input);

  if (guestApiIsLive) {
    const created = await request<CreateReservationApiResponse>("/api/reservations", {
      method: "POST",
      body: JSON.stringify({
        dateStart: input.dateStart,
        dateEnd: input.dateEnd,
        // Przycinamy tu, żeby do bazy trafiło dokładnie to, co zwalidowaliśmy.
        // Backend robi to samo u siebie — nie polegamy na kliencie.
        guestName: input.guestName.trim(),
        guestEmail: input.guestEmail.trim(),
        arrivalDay: input.arrivalDay,
        notes: input.notes,
        isPrivate: input.isPrivate,

        /**
         * Token wyzwania Turnstile.
         *
         * Pole jest opcjonalne w kontrakcie backendu, bo o wymuszaniu decyduje
         * tam flaga TURNSTILE_ENABLED, a nie obecność wartości. Dopóki jest
         * wyłączona, brak tokenu nie zmienia niczego; po włączeniu żądanie bez
         * niego zostanie odrzucone.
         *
         * Tokenu nie logujemy, nie zapisujemy i nie pokazujemy — jest
         * jednorazowym poświadczeniem, nie danymi formularza.
         */
        turnstileToken: input.turnstileToken,
      }),
    });

    return {
      reservationId: created.id,
      // Backend mówi "PENDING", słownik kalendarza — "pending".
      status: "pending",
      dateStart: created.slot.dateStart,
      dateEnd: created.slot.dateEnd,
    };
  }

  return mockCall(() => {
    return mutateDb((db) => {
      const taken = db.reservations.some(
        (r) => r.isWeekend && r.dateStart === input.dateStart && OCCUPYING.has(r.status),
      );
      if (taken) throw apiError("conflict");

      const now = new Date().toISOString();
      const reservation: AdminReservation = {
        id: newId("r"),
        status: "pending",
        dateStart: input.dateStart,
        dateEnd: input.dateEnd,
        isWeekend: true,
        guestName: input.guestName.trim(),
        guestEmail: input.guestEmail.trim(),
        arrivalDay: input.arrivalDay,
        notes: input.notes?.trim() ? input.notes.trim() : null,
        adminNote: null,
        // isPrivate przychodzi z formularza; guestVisible to ta sama decyzja
        // widziana od drugiej strony.
        guestVisible: !input.isPrivate,
        bounce: null,
        archived: false,
        source: "guest",
        createdAt: now,
        updatedAt: now,
      };
      db.reservations.push(reservation);

      // Docelowo tokeny generuje backend i rozsyła je mailem (SQS → lambda → SES).
      const decisionToken = newId("dec");
      const cancelToken = newId("cnc");
      db.tokens.push({ token: decisionToken, kind: "decision", reservationId: reservation.id });
      db.tokens.push({ token: cancelToken, kind: "cancel", reservationId: reservation.id });

      return {
        reservationId: reservation.id,
        status: "pending" as const,
        dateStart: reservation.dateStart,
        dateEnd: reservation.dateEnd,
        decisionUrlForDemo: `/decision?t=${decisionToken}`,
        cancelUrlForDemo: `/cancel?t=${cancelToken}`,
      };
    });
  }, 900);
}

function resolveToken(db: MockDb, token: string, kind: "decision" | "cancel"): AdminReservation {
  const entry = db.tokens.find((t) => t.token === token && t.kind === kind);
  if (!entry) throw apiError("not_found", "Ten link jest nieprawidłowy albo stracił ważność.");
  const reservation = db.reservations.find((r) => r.id === entry.reservationId);
  if (!reservation) throw apiError("not_found", "Nie znaleźliśmy tej rezerwacji.");
  return reservation;
}

/**
 * DECYZJA RODZICÓW MA WŁASNY SERWIS.
 *
 * Mieszkała tu wcześniej — na mockach i pod adresami /decisions/<token>.
 * Została przeniesiona do decisionActionService, bo prawdziwe API działa
 * inaczej w rzeczy zasadniczej: token idzie w CIELE żądania POST, nigdy
 * w ścieżce. Token w URL-u trafia do logów CloudFrontu, do nagłówka Referer
 * i do historii przeglądarki, a raz zapisanego nie da się wycofać.
 *
 * Zostawienie tamtych funkcji obok nowych byłoby zaproszeniem do sięgnięcia
 * po niewłaściwą.
 */

function toCancellation(r: AdminReservation): CancellationResponse {
  return {
    reservationId: r.id,
    status: r.status,
    dateStart: r.dateStart,
    dateEnd: r.dateEnd,
    guestName: r.guestName,
    arrivalDay: r.arrivalDay,
    canCancel: (r.status === "pending" || r.status === "booked") && r.dateEnd >= todayIso(),
    cancelledAt: r.status === "cancelled" ? r.updatedAt : undefined,
  };
}

/** GET — sam podgląd, zgodnie z §9 briefu. */
export async function getCancellation(token: string): Promise<CancellationResponse> {
  if (!usingMocks) return request<CancellationResponse>(`/cancellations/${encodeURIComponent(token)}`);
  return mockCall(() => toCancellation(resolveToken(readDb(), token, "cancel")));
}

export async function cancelReservation(token: string): Promise<CancellationResponse> {
  if (!usingMocks) {
    return request<CancellationResponse>(`/cancellations/${encodeURIComponent(token)}`, { method: "POST" });
  }
  return mockCall(
    () =>
      mutateDb((db) => {
        const reservation = resolveToken(db, token, "cancel");
        if (reservation.status === "cancelled") return toCancellation(reservation);
        if (reservation.status !== "pending" && reservation.status !== "booked") {
          throw apiError("conflict", "Tej wizyty nie da się już odwołać.");
        }
        reservation.status = "cancelled";
        reservation.archived = true;
        reservation.updatedAt = new Date().toISOString();
        return toCancellation(reservation);
      }),
    700,
  );
}
