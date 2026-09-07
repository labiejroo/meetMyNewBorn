import { takeSimulatedFault } from "@/mocks/faults";
import { ApiError, USER_MESSAGES, apiErrorFromStatus, type ApiErrorCode } from "@/types";

/**
 * Punkt wpięcia w backend.
 *
 * Dopóki NEXT_PUBLIC_API_BASE_URL jest puste, serwisy odpowiadają z mocków.
 * Po podaniu adresu API Gateway zmienia się wyłącznie ten plik i ciała funkcji
 * w serwisach — komponenty nie wiedzą, co jest po drugiej stronie.
 */
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

export const usingMocks = API_BASE_URL === "";

/**
 * Czy GOŚCINNA część aplikacji rozmawia z prawdziwym backendem.
 *
 * Świadomie osobna flaga od `usingMocks`. Podłączony jest na razie wyłącznie
 * przepływ gościa (kalendarz + tworzenie rezerwacji); panel gospodarzy, feedback
 * oraz linki decyzyjne nie mają jeszcze endpointów i muszą zostać na mockach.
 * Jedno wspólne przełącznikiem wysłałoby je pod adresy, których nikt nie obsługuje.
 *
 * Reguła jest jedna: pytamy backend wtedy, gdy jest gdzie pytać.
 *   - build produkcyjny  — apka stoi za tym samym CloudFrontem co /api,
 *                          więc adres jest relatywny i nie da się go zapomnieć
 *   - `next dev`         — mocki, chyba że wskażesz NEXT_PUBLIC_API_BASE_URL
 *
 * Dzięki temu produkcja nie może przypadkiem wyjechać na mockach, bo nikt nie
 * ustawił zmiennej środowiskowej.
 */
export const guestApiIsLive = process.env.NODE_ENV === "production" || API_BASE_URL !== "";

/**
 * Czy PANEL GOSPODARZY rozmawia z prawdziwym backendem.
 *
 * Osobna stała od guestApiIsLive, mimo że dziś obie liczą się tak samo. Nie
 * scalam ich, bo znaczą co innego: gościnne API poszło na żywo wcześniej i
 * przez pewien czas panel celowo został na mockach. Wspólna nazwa zacierałaby
 * to rozróżnienie przy następnym takim etapie.
 */
export const adminApiIsLive = guestApiIsLive;

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  offline: 0,
  bad_request: 400,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  server_error: 500,
  unknown: 520,
};

export function apiError(code: ApiErrorCode, message?: string, fields?: Record<string, string>) {
  return new ApiError(code, STATUS_BY_CODE[code], message ?? USER_MESSAGES[code], fields);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wspólne wejście mocków: opóźnienie (żeby loading states były prawdziwe)
 * plus ewentualny błąd zamówiony w panelu deweloperskim.
 */
export async function mockCall<T>(produce: () => T, ms = 420): Promise<T> {
  await wait(ms);
  const fault = takeSimulatedFault();
  if (fault) throw apiError(fault);
  return produce();
}

interface ErrorBody {
  /** NestJS przy błędzie walidacji zwraca TABLICĘ komunikatów, nie string. */
  message?: string | string[];
  fields?: Record<string, string>;
}

/** Prawdziwe wywołanie HTTP — nieużywane, dopóki działamy na mockach. */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw apiError("offline");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      // Ciasteczko sesji gospodarzy jest HttpOnly i host-only, a panel stoi za
      // tym samym CloudFrontem co API — czyli same-origin. Podajemy to jawnie,
      // zamiast polegać na domyślnej wartości przeglądarki.
      //
      // NIGDY "include": to wysyłałoby ciasteczko także cross-site i wymuszało
      // osłabienie SameSite=Strict po stronie backendu.
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    // Sieć padła w trakcie — dla użytkownika to ten sam przypadek co brak internetu.
    throw apiError("offline");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ErrorBody | null;
    // Tablica komunikatów walidacyjnych z backendu jest techniczna i bywa po
    // angielsku — użytkownikowi pokazujemy wtedy nasze własne, łagodne zdanie.
    const message = typeof body?.message === "string" ? body.message : undefined;
    const base = apiErrorFromStatus(response.status, message);
    throw body?.fields ? new ApiError(base.code, base.status, base.message, body.fields) : base;
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/**
 * Czy STRONA DECYZYJNA rozmawia z prawdziwym backendem.
 *
 * Znów osobna stała, z tego samego powodu co adminApiIsLive: trasy
 * /api/reservation-actions powstały najpóźniej i przez jakiś czas mogłyby być
 * jedynymi, których produkcja jeszcze nie ma. Wspólna flaga zmuszałaby wtedy do
 * wyboru między mockami wszędzie a błędami 404 na żywo.
 */
export const decisionApiIsLive = guestApiIsLive;
