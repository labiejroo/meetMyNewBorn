"use client";

import { useCallback, useMemo } from "react";

import { buildAdminCalendar } from "@/services/reservationService";
import type { AdminReservation, CalendarTerm, CalendarWeekend } from "@/types";

/**
 * Kalendarz panelu gospodarzy.
 *
 * W przeciwieństwie do useCalendar NIC NIE POBIERA — dostaje wiersze, które
 * panel i tak już ma dla listy, i wylicza z nich siatkę. Dwa osobne żądania
 * o ten sam stan potrafiłyby się rozjechać między sobą i pokazać kalendarz
 * niezgodny z listą pod nim.
 */
export function useAdminCalendar(rows: AdminReservation[]) {
  const calendar = useMemo(() => buildAdminCalendar(rows), [rows]);

  const bySaturday = useMemo(() => {
    const map = new Map<string, CalendarWeekend>();
    calendar.weekends.forEach((weekend) => map.set(weekend.saturday, weekend));
    return map;
  }, [calendar]);

  /** Weekend spoza wyliczonego zakresu i tak musi się jakoś narysować. */
  const weekendAt = useCallback(
    (saturday: string, sunday: string): CalendarWeekend =>
      bySaturday.get(saturday) ?? {
        saturday,
        sunday,
        state: "blocked",
        reason: "Ten termin jest poza okresem, który można rezerwować.",
      },
    [bySaturday],
  );

  const termAt = useCallback(
    (day: string): CalendarTerm | null =>
      calendar.terms.find((term) => day >= term.dateStart && day <= term.dateEnd) ?? null,
    [calendar],
  );

  return { calendar, weekendAt, termAt };
}
