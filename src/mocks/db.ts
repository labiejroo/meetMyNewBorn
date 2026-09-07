import { addDays, nextSaturday, todayIso } from "@/lib/dates";
import type { AdminReservation } from "@/types";

/**
 * Mockowa „baza”. Cała wiedza o danych siedzi tutaj i w serwisach —
 * ten plik znika w dniu, w którym pojawia się prawdziwe API.
 *
 * Stan trzymamy w sessionStorage, żeby dało się przejść pełny flow:
 * utworzenie rezerwacji → link dla rodziców → decyzja → powrót na kalendarz.
 */

const STORAGE_KEY = "zoja-mock-db-v1";

export type TokenKind = "decision" | "cancel";

export interface MockToken {
  token: string;
  kind: TokenKind;
  reservationId: string;
}

export interface MockFeedback {
  id: string;
  message: string;
  email: string | null;
  receivedAt: string;
}

export interface MockDb {
  reservations: AdminReservation[];
  tokens: MockToken[];
  feedback: MockFeedback[];
}

const stamp = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

function seed(): MockDb {
  const today = todayIso();
  /** Wszystko liczymy od najbliższej soboty, żeby dane nie zestarzały się z czasem. */
  const w = (n: number) => addDays(nextSaturday(today), n * 7);

  const reservations: AdminReservation[] = [
    {
      id: "r-booked-1",
      status: "booked",
      dateStart: w(1), dateEnd: addDays(w(1), 1), isWeekend: true,
      guestName: "Babcia Krysia z dziadkiem Jankiem",
      guestEmail: "krysia.wojcik@example.com",
      arrivalDay: "saturday",
      notes: "Przyjedziemy autem, zostaniemy na obiad.",
      adminNote: null, guestVisible: true, bounce: null, archived: false,
      source: "guest", createdAt: stamp(12), updatedAt: stamp(10),
    },
    {
      id: "r-pending-1",
      status: "pending",
      dateStart: w(2), dateEnd: addDays(w(2), 1), isWeekend: true,
      guestName: "Wujek Andrzej z Marysią",
      guestEmail: "a.nowak@example.com",
      arrivalDay: "saturday",
      notes: "Możemy przywieźć coś do jedzenia, dajcie znać.",
      adminNote: null, guestVisible: true, bounce: null, archived: false,
      source: "guest", createdAt: stamp(2), updatedAt: stamp(2),
    },
    {
      id: "r-blocked-1",
      status: "blocked",
      dateStart: w(4), dateEnd: addDays(w(4), 1), isWeekend: true,
      guestName: "", guestEmail: "", arrivalDay: null,
      notes: null, adminNote: "Wizyta kontrolna w poradni.",
      guestVisible: false, bounce: null, archived: false,
      source: "admin", createdAt: stamp(20), updatedAt: stamp(20),
    },
    {
      id: "r-booked-2",
      status: "booked",
      dateStart: w(5), dateEnd: addDays(w(5), 1), isWeekend: true,
      guestName: "Prababcia Zofia z rodziną z Rzeszowa",
      guestEmail: "zofia.rzeszow@example.invalid",
      arrivalDay: "sunday",
      notes: "Będzie nas sześcioro, w tym dwoje dzieci.",
      adminNote: "Mail wrócił, trzeba zadzwonić.",
      guestVisible: true,
      // Przypadek odbitego maila: docelowo wpada tu SES → SNS → lambda bounce-handler.
      bounce: {
        type: "hard",
        bouncedAt: stamp(4),
        reason: "Adres nie istnieje (550 5.1.1 user unknown).",
      },
      archived: false,
      source: "guest", createdAt: stamp(6), updatedAt: stamp(4),
    },
    {
      id: "r-rejected-1",
      status: "rejected",
      dateStart: w(3), dateEnd: addDays(w(3), 1), isWeekend: true,
      guestName: "Sąsiedzi z góry",
      guestEmail: "sasiedzi@example.com",
      arrivalDay: null,
      notes: null, adminNote: "Za blisko wizyty u lekarza.",
      guestVisible: false, bounce: null, archived: true,
      source: "guest", createdAt: stamp(9), updatedAt: stamp(8),
    },
    {
      id: "r-cancelled-1",
      status: "cancelled",
      dateStart: w(6), dateEnd: addDays(w(6), 1), isWeekend: true,
      guestName: "Kolega Michał z żoną",
      guestEmail: "michal@example.com",
      arrivalDay: "sunday",
      notes: null, adminNote: null, guestVisible: true, bounce: null, archived: true,
      source: "guest", createdAt: stamp(11), updatedAt: stamp(3),
    },
    {
      id: "r-expired-1",
      status: "expired",
      dateStart: addDays(nextSaturday(today), -14),
      dateEnd: addDays(nextSaturday(today), -13),
      isWeekend: true,
      guestName: "Wujek Zbyszek",
      guestEmail: "zbyszek@example.com",
      arrivalDay: null,
      notes: null, adminNote: "Brak odpowiedzi rodziców w 7 dni.",
      guestVisible: false, bounce: null, archived: true,
      source: "guest", createdAt: stamp(30), updatedAt: stamp(21),
    },
    {
      // Termin admina: dzień roboczy w środku przerwy świątecznej.
      id: "r-admin-xmas",
      status: "booked",
      dateStart: "2026-12-24", dateEnd: "2026-12-26", isWeekend: false,
      guestName: "Chrzestna Hania z Jankiem",
      guestEmail: "hania.j@example.com",
      arrivalDay: null,
      notes: "Wigilia i pierwszy dzień świąt.",
      adminNote: "Ustalone telefonicznie.",
      guestVisible: true, bounce: null, archived: false,
      source: "admin", createdAt: stamp(15), updatedAt: stamp(15),
    },
  ];

  const tokens: MockToken[] = [
    { token: "demo-rodzice-oczekuje", kind: "decision", reservationId: "r-pending-1" },
    { token: "demo-rodzice-juz-po", kind: "decision", reservationId: "r-booked-1" },
    { token: "demo-gosc-odwolanie", kind: "cancel", reservationId: "r-booked-1" },
    { token: "demo-gosc-juz-odwolane", kind: "cancel", reservationId: "r-cancelled-1" },
  ];

  return { reservations, tokens, feedback: [] };
}

let cache: MockDb | null = null;

function load(): MockDb {
  if (cache) return cache;
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        cache = JSON.parse(raw) as MockDb;
        return cache;
      }
    } catch {
      // Prywatne okno albo zablokowane dane stron — jedziemy na świeżym seedzie.
    }
  }
  cache = seed();
  return cache;
}

function persist(db: MockDb) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Brak miejsca albo brak dostępu — mock działa dalej w pamięci.
  }
}

export function readDb(): MockDb {
  return load();
}

export function mutateDb<T>(change: (db: MockDb) => T): T {
  const db = load();
  const result = change(db);
  persist(db);
  return result;
}

/** Kasuje stan mocka — przydatne przy testowaniu flow od zera. */
export function resetDb() {
  cache = seed();
  persist(cache);
}

export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
