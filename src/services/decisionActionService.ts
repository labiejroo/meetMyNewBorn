import type { ApiDecisionPreview, ApiDecisionResult } from "@/types";

import type { DecisionAction } from "@/hooks/useDecisionLink";
import { decisionApiIsLive, mockCall, request } from "./http";

/**
 * DECYZJA Z LINKU W MAILU.
 *
 * Osobny serwis, a nie kolejne funkcje w reservationService. Ten obszar ma
 * własne poświadczenie — token z wiadomości zamiast trybu ?zoja — więc trzymanie
 * go osobno pokazuje wprost, że to inna droga do tych samych rezerwacji.
 *
 * WSZYSTKO JEST POST-em, ŁĄCZNIE Z PODGLĄDEM.
 *
 * Przy podglądzie to nie pomyłka: token nie może znaleźć się w URL-u, bo
 * stamtąd trafiłby do logów i do historii przeglądarki. W ciele żądania nie
 * trafia nigdzie.
 *
 * Przy decyzji powód jest mocniejszy. Skanery odnośników w klientach pocztowych
 * otwierają linki z wiadomości samodzielnie, zanim człowiek ją przeczyta —
 * gdyby potwierdzenie zapadało na GET, skaner podejmowałby decyzje za rodziców.
 */

/** Ścieżki backendu — jedna na akcję, żeby nie przesyłać intencji w ciele. */
const ACTION_PATH: Record<DecisionAction, string> = {
  confirm: "/api/reservation-actions/confirm",
  reject: "/api/reservation-actions/reject",
};

/** Przykładowa prośba dla `next dev` bez podłączonego backendu. */
const MOCK_PREVIEW: ApiDecisionPreview = {
  reservationId: "podglad-lokalny",
  guestName: "Babcia Krysia",
  guestEmail: "krysia@example.com",
  dateStart: "2031-01-04",
  dateEnd: "2031-01-05",
  arrivalDay: "saturday",
  notes: "Przyjedziemy autem, będziemy koło południa.",
  status: "PENDING",
};

/** READ ONLY. Otwarcie strony niczego nie zmienia. */
export async function previewDecision(token: string): Promise<ApiDecisionPreview> {
  if (!decisionApiIsLive) return mockCall(() => MOCK_PREVIEW);

  return request<ApiDecisionPreview>("/api/reservation-actions/preview", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

/** Wywoływane WYŁĄCZNIE z obsługi kliknięcia — nigdy przy wejściu na stronę. */
export async function submitDecision(
  action: DecisionAction,
  token: string,
): Promise<ApiDecisionResult> {
  if (!decisionApiIsLive) {
    return mockCall(
      () => ({
        status: action === "confirm" ? "CONFIRMED" : "REJECTED",
        message:
          action === "confirm"
            ? "Rezerwacja została potwierdzona."
            : "Rezerwacja została odrzucona.",
      }),
      700,
    );
  }

  return request<ApiDecisionResult>(ACTION_PATH[action], {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
