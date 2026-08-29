import type { Status } from "./types";

export interface StatusMeta { color: string; ink: string; icon: string; label: string }

export const STATUS: Record<Status, StatusMeta> = {
  free:    { color: "#7C9A73", ink: "#3D5A37", icon: "+",   label: "Wolne" },
  pending: { color: "#D9A441", ink: "#7A5410", icon: "•••", label: "Prośba" },
  taken:   { color: "#C4685C", ink: "#8A3A31", icon: "✓",   label: "Zajęte" },
  blocked: { color: "#B3A99F", ink: "#615850", icon: "✕",   label: "Zablokowane" },
  holiday: { color: "#B3A99F", ink: "#615850", icon: "★",   label: "Święto" },
  past:    { color: "#CFC5B9", ink: "#A79C90", icon: "",    label: "Minęło" },
  archive: { color: "#B3A99F", ink: "#615850", icon: "–",   label: "Archiwum" },
};

export function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export const arrivalLabel = (arrival: "sat" | "sun" | null | undefined) =>
  arrival === "sat" ? "Przyjazd w sobotę"
  : arrival === "sun" ? "Przyjazd w niedzielę"
  : "Dzień przyjazdu jeszcze nieznany";
