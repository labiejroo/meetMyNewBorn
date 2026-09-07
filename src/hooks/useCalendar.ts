"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getCalendar } from "@/services/reservationService";
import { userMessage } from "@/types";
import type { CalendarResponse, CalendarTerm, CalendarWeekend } from "@/types";

/**
 * Kalendarz zawsze pochodzi z warstwy serwisów — komponenty nie mają dostępu
 * do danych źródłowych i nie liczą dostępności same. Frontend tylko prezentuje
 * i filtruje to, co dostał.
 */
export function useCalendar() {
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCalendar(await getCalendar());
    } catch (caught) {
      setError(userMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const bySaturday = useMemo(() => {
    const map = new Map<string, CalendarWeekend>();
    calendar?.weekends.forEach((weekend) => map.set(weekend.saturday, weekend));
    return map;
  }, [calendar]);

  /** Weekend spoza odpowiedzi serwera i tak musi się jakoś narysować. */
  const weekendAt = useCallback(
    (saturday: string, sunday: string): CalendarWeekend => {
      const known = bySaturday.get(saturday);
      if (known) return known;
      if (!calendar) return { saturday, sunday, state: "past" };
      if (saturday < calendar.rangeStart) return { saturday, sunday, state: "past" };
      return {
        saturday,
        sunday,
        state: "blocked",
        reason: "Ten termin jest poza okresem, który można rezerwować.",
      };
    },
    [bySaturday, calendar],
  );

  const termAt = useCallback(
    (day: string): CalendarTerm | null =>
      calendar?.terms.find((term) => day >= term.dateStart && day <= term.dateEnd) ?? null,
    [calendar],
  );

  return { calendar, loading, error, reload: load, weekendAt, termAt };
}
