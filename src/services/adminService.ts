import { BOOKING_RANGE_END, addDays, nextSaturday, todayIso } from "@/lib/dates";
import { mutateDb, newId, readDb } from "@/mocks/db";
import type {
  AdminReservation, AdminReservationsQuery, ApiAdminReservation, ApiAdminVisitSlot,
  CreateAdminReservationInput, CreateBlockedDateInput, ReservationStatus,
  UpdateReservationInput,
} from "@/types";

import { adminApiIsLive, apiError, mockCall, request } from "./http";

/**
 * Operacje gospodarzy. Parametr `?zoja` po stronie frontu tylko odsłania te
 * ekrany. Backend nie ma dziś żadnej autoryzacji na `/api/admin/*` — nie
 * udajemy więc, że jest, i nie wysyłamy żadnego tokenu.
 */

/** Rezerwacja jest archiwalna, gdy nic już z niej nie wynika. */
function isArchived(r: AdminReservation): boolean {
  if (r.status === "rejected" || r.status === "cancelled" || r.status === "expired") return true;
  return r.dateEnd < todayIso();
}

function sortByDate(a: AdminReservation, b: AdminReservation) {
  return a.dateStart < b.dateStart ? -1 : a.dateStart > b.dateStart ? 1 : 0;
}

/* ------------------------------------------------------------------ *
 * ADAPTER: model backendu  ->  view-model panelu
 *
 * Backend rozdziela TERMIN od REZERWACJI. Panel powstał wcześniej na modelu
 * płaskim, w którym rezerwacja sama niesie daty, a blokada jest jej statusem.
 * Zamiast przepisywać cały panel, tłumaczymy jedno na drugie tutaj — zgodnie
 * z zasadą: podmieniamy warstwę danych, nie UI.
 * ------------------------------------------------------------------ */

/**
 * Zablokowany termin nie ma rezerwacji, a panel potrzebuje jakiegoś wiersza,
 * żeby dało się go kliknąć i odblokować. Robimy więc pozycję syntetyczną
 * z prefiksem w identyfikatorze — po nim mutacje poznają, że mają uderzyć
 * w endpoint TERMINU, a nie rezerwacji.
 */
const SLOT_PREFIX = "slot:";

const asSlotRowId = (slotId: string) => `${SLOT_PREFIX}${slotId}`;
const isSlotRow = (id: string) => id.startsWith(SLOT_PREFIX);
const slotIdFromRow = (id: string) => id.slice(SLOT_PREFIX.length);

const STATUS_FROM_API: Record<ApiAdminReservation["status"], ReservationStatus> = {
  PENDING: "pending",
  CONFIRMED: "booked",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};

/** Przejścia statusu mają własne endpointy — PATCH ich nie przyjmuje. */
const TRANSITION_PATH: Partial<Record<ReservationStatus, string>> = {
  booked: "confirm",
  rejected: "reject",
  cancelled: "cancel",
};

function toAdminRow(slot: ApiAdminVisitSlot, reservation: ApiAdminReservation): AdminReservation {
  const row: AdminReservation = {
    id: reservation.id,
    slotId: slot.id,
    status: STATUS_FROM_API[reservation.status],
    dateStart: slot.dateStart,
    dateEnd: slot.dateEnd,
    isWeekend: slot.isWeekend,
    guestName: reservation.guestName,
    guestEmail: reservation.guestEmail,
    arrivalDay: reservation.arrivalDay,
    notes: reservation.notes,
    // Panel mówi „pokaż innym”, backend „ukryj” — ta sama decyzja odwrócona.
    guestVisible: !reservation.isPrivate,
    adminNote: reservation.adminNote,
    // TODO: email delivery state comes with SES integration.
    bounce: null,
    archived: false,
    source: "guest",
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
  };
  row.archived = isArchived(row);
  return row;
}

function blockedSlotToRow(slot: ApiAdminVisitSlot): AdminReservation {
  const row: AdminReservation = {
    id: asSlotRowId(slot.id),
    slotId: slot.id,
    status: "blocked",
    dateStart: slot.dateStart,
    dateEnd: slot.dateEnd,
    isWeekend: slot.isWeekend,
    guestName: "",
    guestEmail: "",
    arrivalDay: null,
    notes: null,
    adminNote: slot.blockedReason,
    guestVisible: false,
    bounce: null,
    archived: false,
    source: "admin",
    createdAt: slot.createdAt,
    updatedAt: slot.updatedAt,
  };
  row.archived = isArchived(row);
  return row;
}

/** Okno, o które pytamy backend — to samo, które generuje kalendarz gościa. */
function adminRange(): { from: string; to: string } {
  return { from: addDays(nextSaturday(todayIso()), -14), to: BOOKING_RANGE_END };
}

async function fetchAdminRows(): Promise<AdminReservation[]> {
  const { from, to } = adminRange();
  const slots = await request<ApiAdminVisitSlot[]>(
    `/api/admin/visit-slots?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );

  const rows: AdminReservation[] = [];
  for (const slot of slots) {
    // Historia też trafia na listę: rodzice mają widzieć, kto już pytał
    // o ten termin i co się z tą prośbą stało.
    slot.reservations.forEach((reservation) => rows.push(toAdminRow(slot, reservation)));

    // Blokada bez rezerwacji potrzebuje własnego wiersza, żeby dało się ją zdjąć.
    if (slot.isBlocked && slot.reservations.length === 0) rows.push(blockedSlotToRow(slot));
  }
  return rows;
}

export async function getAdminReservations(
  query: AdminReservationsQuery = {},
): Promise<AdminReservation[]> {
  if (adminApiIsLive) {
    const rows = await fetchAdminRows();
    const visible = query.includeArchived ? rows : rows.filter((r) => !r.archived);
    return visible.sort(sortByDate);
  }

  return mockCall(() => {
    const all = readDb().reservations.map((r) => ({ ...r, archived: isArchived(r) }));
    const visible = query.includeArchived ? all : all.filter((r) => !r.archived);
    return visible.slice().sort(sortByDate);
  }, 480);
}

function findOrThrow(reservations: AdminReservation[], id: string): AdminReservation {
  const found = reservations.find((r) => r.id === id);
  if (!found) throw apiError("not_found", "Nie znaleźliśmy tej rezerwacji.");
  return found;
}

/**
 * Zapis zmian z panelu.
 *
 * Rozbija jedno kliknięcie „Zapisz” na tyle wywołań, ile trzeba: osobno pola
 * rezerwacji, osobno przejście statusu. Backend celowo nie pozwala ustawić
 * statusu PATCH-em — każde przejście ma własne reguły (czego nie wolno
 * reaktywować, co jest idempotentne) i docelowo własnego maila.
 *
 * W trybie live nie sklejamy odpowiedzi z kilku wywołań — panel i tak robi
 * po zapisie refetch, a zgadywany wynik byłby drugim źródłem prawdy.
 */
export async function updateReservation(
  id: string,
  input: UpdateReservationInput,
): Promise<AdminReservation | void> {
  if (adminApiIsLive) {
    if (isSlotRow(id)) {
      // Wiersz syntetyczny = zablokowany termin. Jedyne, co da się z nim
      // zrobić, to zdjąć blokadę albo zmienić jej powód.
      const stillBlocked = input.status === undefined || input.status === "blocked";
      await request<unknown>(`/api/admin/visit-slots/${encodeURIComponent(slotIdFromRow(id))}`, {
        method: "PATCH",
        body: JSON.stringify(
          stillBlocked
            ? { isBlocked: true, blockedReason: input.adminNote ?? null }
            : { isBlocked: false },
        ),
      });
      return;
    }

    const patch: Record<string, unknown> = {};
    if (input.guestName !== undefined) patch.guestName = input.guestName;
    if (input.guestEmail !== undefined) patch.guestEmail = input.guestEmail;
    if (input.arrivalDay !== undefined) patch.arrivalDay = input.arrivalDay;
    if (input.notes !== undefined) patch.notes = input.notes;
    // notes to wiadomosc GOSCIA, adminNote prywatna notatka RODZICOW —
    // dwa rozne pojecia, wiec dwa osobne pola, nigdy jedno na drugie.
    if (input.adminNote !== undefined) patch.adminNote = input.adminNote;
    if (input.guestVisible !== undefined) patch.isPrivate = !input.guestVisible;
    // Przeniesienie terminu: backend przyjmuje obie daty albo żadnej.
    if (input.dateStart !== undefined && input.dateEnd !== undefined) {
      patch.dateStart = input.dateStart;
      patch.dateEnd = input.dateEnd;
    }

    if (Object.keys(patch).length > 0) {
      await request<unknown>(`/api/admin/reservations/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    }

    if (input.status !== undefined) {
      const action = TRANSITION_PATH[input.status];
      if (!action) {
        throw apiError("bad_request", "Tego statusu nie da się ustawić z panelu.");
      }
      await request<unknown>(`/api/admin/reservations/${encodeURIComponent(id)}/${action}`, {
        method: "POST",
      });
    }
    return;
  }

  return mockCall(() =>
    mutateDb((db) => {
      const reservation = findOrThrow(db.reservations, id);

      if (input.dateStart && input.dateEnd && input.dateStart > input.dateEnd) {
        throw apiError("bad_request", "Data początkowa jest późniejsza niż końcowa.");
      }

      Object.assign(reservation, {
        ...input,
        // Zmiana zakresu może zrobić z weekendu termin dowolny i odwrotnie.
        isWeekend:
          input.dateStart && input.dateEnd
            ? new Date(input.dateEnd).getTime() - new Date(input.dateStart).getTime() === 86400000
            : reservation.isWeekend,
        updatedAt: new Date().toISOString(),
      });
      reservation.archived = isArchived(reservation);
      return { ...reservation };
    }),
  600);
}

export async function createBlockedDate(
  input: CreateBlockedDateInput,
): Promise<AdminReservation | void> {
  if (adminApiIsLive) {
    await request<ApiAdminVisitSlot>("/api/admin/visit-slots", {
      method: "POST",
      body: JSON.stringify({
        dateStart: input.dateStart,
        dateEnd: input.dateEnd,
        isBlocked: true,
        blockedReason: input.reason,
        // isWeekend celowo nie leci — backend liczy je sam z zakresu dat.
      }),
    });
    return;
  }

  return mockCall(() =>
    mutateDb((db) => {
      const clash = db.reservations.find(
        (r) =>
          (r.status === "pending" || r.status === "booked") &&
          input.dateStart <= r.dateEnd &&
          input.dateEnd >= r.dateStart,
      );
      if (clash) throw apiError("conflict", "W tym zakresie jest już rezerwacja.");

      const now = new Date().toISOString();
      const blocked: AdminReservation = {
        id: newId("blk"),
        status: "blocked",
        dateStart: input.dateStart,
        dateEnd: input.dateEnd,
        isWeekend:
          new Date(input.dateEnd).getTime() - new Date(input.dateStart).getTime() === 86400000,
        guestName: "",
        guestEmail: "",
        arrivalDay: null,
        notes: null,
        adminNote: input.reason,
        guestVisible: false,
        bounce: null,
        archived: false,
        source: "admin",
        createdAt: now,
        updatedAt: now,
      };
      db.reservations.push(blocked);
      return { ...blocked };
    }),
  600);
}

/**
 * Ręczne założenie wizyty przez gospodarzy — na przykład umówionej telefonicznie.
 *
 * Statusu NIE wysyłamy: backend ustawia CONFIRMED sam, bo przy wpisie ręcznym
 * nie ma prośby, na którą ktoś miałby odpowiedzieć. Świadomie nie idziemy też
 * obejściem „publiczny POST plus confirm” — to byłyby dwa żądania udające
 * zgłoszenie gościa, z krótkim stanem PENDING widocznym publicznie pomiędzy.
 */
export async function createAdminReservation(
  input: CreateAdminReservationInput,
): Promise<AdminReservation | void> {
  if (adminApiIsLive) {
    await request<unknown>("/api/admin/reservations", {
      method: "POST",
      body: JSON.stringify({
        dateStart: input.dateStart,
        dateEnd: input.dateEnd,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        arrivalDay: input.arrivalDay,
        // Notatka wewnętrzna gospodarzy — nie mylić z notes, czyli wiadomością
        // gościa, której przy wpisie ręcznym po prostu nie ma.
        ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
      }),
    });
    return;
  }

  return mockCall(() =>
    mutateDb((db) => {
      if (input.dateStart > input.dateEnd) {
        throw apiError("bad_request", "Data początkowa jest późniejsza niż końcowa.");
      }

      const now = new Date().toISOString();
      const reservation: AdminReservation = {
        id: newId("r"),
        status: input.status,
        dateStart: input.dateStart,
        dateEnd: input.dateEnd,
        isWeekend:
          new Date(input.dateEnd).getTime() - new Date(input.dateStart).getTime() === 86400000,
        guestName: input.guestName.trim(),
        guestEmail: input.guestEmail.trim(),
        arrivalDay: input.arrivalDay,
        notes: input.notes?.trim() ? input.notes.trim() : null,
        adminNote: input.adminNote?.trim() ? input.adminNote.trim() : null,
        guestVisible: true,
        bounce: null,
        archived: false,
        source: "admin",
        createdAt: now,
        updatedAt: now,
      };
      db.reservations.push(reservation);
      return { ...reservation };
    }),
  600);
}

/**
 * Usunięcie wiersza z panelu.
 *
 * Wiersz syntetyczny kasuje TERMIN, zwykły — rezerwację. Backend broni obu
 * przypadków po swojemu: terminu z historią nie usunie (409), a zniknionej
 * rezerwacji zgłosi jako 404.
 */
export async function deleteReservation(id: string): Promise<void> {
  if (adminApiIsLive) {
    const path = isSlotRow(id)
      ? `/api/admin/visit-slots/${encodeURIComponent(slotIdFromRow(id))}`
      : `/api/admin/reservations/${encodeURIComponent(id)}`;
    await request<void>(path, { method: "DELETE" });
    return;
  }

  await mockCall(() =>
    mutateDb((db) => {
      findOrThrow(db.reservations, id);
      db.reservations = db.reservations.filter((r) => r.id !== id);
      db.tokens = db.tokens.filter((t) => t.reservationId !== id);
    }),
  600);
}
