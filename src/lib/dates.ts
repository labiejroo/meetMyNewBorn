const MONTHS = ["styczeń","luty","marzec","kwiecień","maj","czerwiec","lipiec","sierpień","wrzesień","październik","listopad","grudzień"];
const DOW = ["niedziela","poniedziałek","wtorek","środa","czwartek","piątek","sobota"];

/**
 * Koniec okna rezerwacyjnego dla zwykłego gościa.
 *
 * To JEDYNA górna granica w całym systemie. Backend sprawdza wyłącznie, czy
 * termin nie minął, i przyjąłby datę dowolnie odległą — rozszerzenie okna
 * sprowadza się więc do tej stałej, ale i cała odpowiedzialność za nie leży
 * tutaj.
 *
 * UWAGA PRZY DALSZYM WYDŁUŻANIU: kalendarz pobiera terminy JEDNYM zapytaniem,
 * od najbliższej soboty (panel: dwa tygodnie wstecz) do tej daty, a backend
 * odrzuca zakresy szersze niż MAX_RANGE_DAYS = 366 dni. Dziś mieścimy się
 * z zapasem — najszerszy przypadek to 244 dni — ale okno sięgające dalej niż
 * rok od dziś zacznie się o ten limit odbijać.
 */
export const BOOKING_RANGE_END = "2027-04-30";
export const BLACKOUT_START = "2026-12-23";
export const BLACKOUT_END = "2027-01-06";

export const HOLIDAYS: Record<string, string> = {
  "2026-11-01": "Wszystkich Świętych",
  "2026-11-11": "Święto Niepodległości",
  "2026-12-25": "Boże Narodzenie",
  "2026-12-26": "Drugi dzień świąt",
  "2027-01-01": "Nowy Rok",
  "2027-01-06": "Trzech Króli",
  // Wielkanoc 2027 wypada 28 marca, czyli w NIEDZIELĘ — i to ona wyłącza
  // weekend 27–28 marca, bo stan weekendu liczymy z soboty albo niedzieli.
  // Poniedziałek Wielkanocny jest dniem roboczym i sam z siebie niczego nie
  // blokuje; trzymamy go tu, bo ta lista jest wykazem świąt w oknie, a nie
  // tylko zbiorem dat wyłączających weekendy — tak samo jak Trzech Króli.
  "2027-03-28": "Wielkanoc",
  "2027-03-29": "Poniedziałek Wielkanocny",
};

export const dt = (s: string) => new Date(s + "T00:00:00Z");
export const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Dzisiejsza data. Liczona na bieżąco — nie zamrażamy jej w stałej. */
export const todayIso = () => iso(new Date());

export function addDays(s: string, n: number) {
  const d = dt(s);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}
export const dayNum = (s: string) => dt(s).getUTCDate();
export const monthOf = (s: string) => dt(s).getUTCMonth() + 1;
export const dowName = (s: string) => DOW[dt(s).getUTCDay()];
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const dd = (s: string) => s.slice(8, 10) + "." + s.slice(5, 7);

/** „Sobota 12.09 – niedziela 13.09” */
export const formatRange = (a: string, b: string) =>
  a === b ? cap(dowName(a)) + " " + dd(a) : cap(dowName(a)) + " " + dd(a) + " – " + dowName(b) + " " + dd(b);

/** „12 września 2026” — do ekranów decyzji, gdzie liczy się jednoznaczność. */
export const formatLong = (s: string) => {
  const genitive = ["stycznia","lutego","marca","kwietnia","maja","czerwca","lipca","sierpnia","września","października","listopada","grudnia"];
  return `${dayNum(s)} ${genitive[monthOf(s) - 1]} ${s.slice(0, 4)}`;
};

export const monthTitle = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return cap(MONTHS[m - 1]) + " " + y;
};
export function shiftMonth(key: string, n: number) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}
export const inBlackout = (s: string) => s >= BLACKOUT_START && s <= BLACKOUT_END;
export const isSaturday = (s: string) => dt(s).getUTCDay() === 6;

/** Pierwsza sobota od podanej daty włącznie. */
export function nextSaturday(from: string) {
  let d = from;
  while (!isSaturday(d)) d = addDays(d, 1);
  return d;
}

/** Tygodnie miesiąca, poniedziałek pierwszy; każdy wiersz = 5 dni roboczych + sobota pary. */
export function monthWeeks(key: string) {
  const [y, m] = key.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const rows = Math.ceil((offset + daysInMonth) / 7);
  const start = addDays(iso(first), -offset);
  return Array.from({ length: rows }, (_, r) => {
    const monday = addDays(start, r * 7);
    return {
      monday,
      weekdays: Array.from({ length: 5 }, (_, i) => addDays(monday, i)),
      saturday: addDays(monday, 5),
    };
  });
}
