import type { ArrivalDay, ReservationStatus, WeekendState } from "@/types";

export interface StatusMeta {
  color: string;
  ink: string;
  icon: string;
  label: string;
}

/** Wygląd kratki w kalendarzu. */
export const WEEKEND_STATE: Record<WeekendState, StatusMeta> = {
  free:    { color: "#7C9A73", ink: "#3D5A37", icon: "+",   label: "Wolne" },
  pending: { color: "#D9A441", ink: "#7A5410", icon: "•••", label: "Prośba" },
  booked:  { color: "#C4685C", ink: "#8A3A31", icon: "✓",   label: "Zajęte" },
  blocked: { color: "#B3A99F", ink: "#615850", icon: "✕",   label: "Zablokowane" },
  holiday: { color: "#B3A99F", ink: "#615850", icon: "★",   label: "Święto" },
  past:    { color: "#CFC5B9", ink: "#A79C90", icon: "",    label: "Minęło" },
};

/** Wygląd statusu rezerwacji na listach gospodarzy. */
export const RESERVATION_STATUS: Record<ReservationStatus, StatusMeta> = {
  pending:   { color: "#D9A441", ink: "#7A5410", icon: "•••", label: "Czeka na decyzję" },
  booked:    { color: "#C4685C", ink: "#8A3A31", icon: "✓",   label: "Potwierdzona" },
  rejected:  { color: "#B3A99F", ink: "#615850", icon: "–",   label: "Odrzucona" },
  cancelled: { color: "#B3A99F", ink: "#615850", icon: "–",   label: "Odwołana" },
  blocked:   { color: "#B3A99F", ink: "#615850", icon: "✕",   label: "Zablokowany" },
  expired:   { color: "#CFC5B9", ink: "#A79C90", icon: "–",   label: "Wygasła" },
};

/** Co gość widzi, gdy termin jest niedostępny — bez żargonu. */
export const WEEKEND_STATE_HINT: Record<WeekendState, string> = {
  free: "Ten weekend jest wolny.",
  pending: "Czeka na potwierdzenie przez rodziców.",
  booked: "Ten weekend jest już zajęty.",
  blocked: "Ten termin jest niedostępny.",
  holiday: "W tym terminie mamy przerwę świąteczną.",
  past: "Ten termin już minął.",
};

export function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export const arrivalLabel = (arrival: ArrivalDay | undefined) =>
  arrival === "saturday" ? "Przyjazd w sobotę"
  : arrival === "sunday" ? "Przyjazd w niedzielę"
  : "Dzień przyjazdu jeszcze nieznany";

/** Czy gość może kliknąć ten weekend. */
export const isSelectable = (state: WeekendState) => state === "free";
