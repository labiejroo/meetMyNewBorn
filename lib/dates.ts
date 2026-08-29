const MONTHS = ["styczeń","luty","marzec","kwiecień","maj","czerwiec","lipiec","sierpień","wrzesień","październik","listopad","grudzień"];
const DOW = ["niedziela","poniedziałek","wtorek","środa","czwartek","piątek","sobota"];

export const TODAY = "2026-08-28";
export const MIN_MONTH = "2026-08";
export const MAX_MONTH = "2027-01";
export const BLACKOUT_START = "2026-12-23";
export const BLACKOUT_END = "2027-01-06";

export const HOLIDAYS: Record<string, string> = {
  "2026-11-01": "Wszystkich Świętych",
  "2026-11-11": "Święto Niepodległości",
  "2026-12-25": "Boże Narodzenie",
  "2026-12-26": "Drugi dzień świąt",
  "2027-01-01": "Nowy Rok",
  "2027-01-06": "Trzech Króli",
};

export const dt = (s: string) => new Date(s + "T00:00:00Z");
export const iso = (d: Date) => d.toISOString().slice(0, 10);
export function addDays(s: string, n: number) {
  const d = dt(s);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}
export const dayNum = (s: string) => dt(s).getUTCDate();
export const monthOf = (s: string) => dt(s).getUTCMonth() + 1;
export const dd = (s: string) => s.slice(8, 10) + "." + s.slice(5, 7);
export const dowName = (s: string) => DOW[dt(s).getUTCDay()];
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** „Sobota 12.09 – niedziela 13.09” */
export const formatRange = (a: string, b: string) =>
  cap(dowName(a)) + " " + dd(a) + " – " + dowName(b) + " " + dd(b);

export const monthTitle = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return cap(MONTHS[m - 1]) + " " + y;
};
export function shiftMonth(key: string, n: number) {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}
export const inBlackout = (s: string) => s >= BLACKOUT_START && s <= BLACKOUT_END;

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
