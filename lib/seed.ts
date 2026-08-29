import type { Booking, Term } from "./types";

/** Dane początkowe — pokrywają wszystkie przypadki brzegowe z briefu. */
export const SEED_BOOKINGS: Record<string, Booking> = {
  "2026-09-05": { status: "taken", guest: "Babcia Krysia z dziadkiem Jankiem", email: "krysia.wojcik@example.com", arrival: "sat", visible: true },
  "2026-09-12": { status: "taken", guest: "Ciocia Marta z Tomkiem", email: "marta.t@example.com", arrival: "sun", visible: true },
  "2026-09-19": { status: "taken", guest: "Chrzestni Zosi i Pawła", email: "zosia.p@example.com", arrival: null, visible: true },
  "2026-09-26": { status: "taken", guest: "Kuzyni z Gdańska", email: "kuzyni.gda@example.com", arrival: "sat", visible: false },
  "2026-10-03": { status: "pending", guest: "Wujek Andrzej z Marysią", email: "a.nowak@example.com", arrival: "sat", visible: true },
  "2026-10-10": { status: "blocked", reason: "Gospodarze niedostępni — wyjazd do lekarza" },
  "2026-10-24": { status: "taken", guest: "Prababcia Zofia z całą rodziną z Rzeszowa — Marek, Ewa, Kasia i mały Antek", email: "zofia.rzeszow@example.com", arrival: "sun", visible: true },
  "2026-11-14": { status: "blocked", reason: "Gospodarze niedostępni" },
  "2026-12-12": { status: "taken", guest: "Rodzice Ani z siostrą", email: "ania.rodzice@example.com", arrival: "sat", visible: true },
};

/** Termin poza weekendem, w środku przerwy świątecznej — admin przebija blokadę. */
export const SEED_TERMS: Term[] = [
  { id: "t-xmas", start: "2026-12-25", end: "2026-12-26", status: "taken", guest: "Chrzestna Hania z Jankiem", email: "hania.j@example.com", arrival: null, visible: true },
];

export const ARCHIVE: Term[] = [
  { id: "a1", start: "2026-08-01", end: "2026-08-02", status: "archive", kind: "Wygasła — brak potwierdzenia", guest: "Sąsiedzi z góry", email: "sasiedzi@example.com", arrival: "sat", visible: true },
  { id: "a2", start: "2026-08-15", end: "2026-08-16", status: "archive", kind: "Odwołana przez gościa", guest: "Kolega Michał z żoną", email: "michal@example.com", arrival: "sun", visible: false },
  { id: "a3", start: "2026-08-22", end: "2026-08-23", status: "archive", kind: "Usunięta przez gospodarzy", guest: "Wujek Zbyszek", email: "zbyszek@example.com", arrival: null, visible: true },
];
