/**
 * Kody błędów, na które apka reaguje inaczej niż „coś poszło nie tak”.
 * Mapują się na statusy HTTP, które zwróci API Gateway.
 */
export type ApiErrorCode =
  | "offline"
  | "bad_request"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "server_error"
  | "unknown";

/**
 * Jedyny typ błędu, jaki warstwa serwisów wypuszcza na zewnątrz.
 * Komponenty nigdy nie oglądają surowego wyjątku ani stack trace.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  /** Szczegóły walidacji z backendu, jeśli przyszły. */
  readonly fields?: Record<string, string>;

  constructor(code: ApiErrorCode, status: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

const HTTP_TO_CODE: Record<number, ApiErrorCode> = {
  400: "bad_request",
  404: "not_found",
  409: "conflict",
  429: "rate_limited",
  500: "server_error",
  502: "server_error",
  503: "server_error",
};

export function apiErrorFromStatus(status: number, message?: string): ApiError {
  const code = HTTP_TO_CODE[status] ?? "unknown";
  return new ApiError(code, status, message ?? USER_MESSAGES[code]);
}

/**
 * Komunikaty dla użytkownika. Prostym językiem, bez technicznych szczegółów —
 * dużą część odbiorców stanowią osoby 50+.
 */
export const USER_MESSAGES: Record<ApiErrorCode, string> = {
  offline: "Wygląda na to, że nie ma połączenia z internetem. Sprawdź je i spróbuj jeszcze raz.",
  bad_request: "Coś w formularzu się nie zgadza. Sprawdź, proszę, wpisane dane.",
  not_found: "Nie znaleźliśmy tego terminu. Link mógł stracić ważność.",
  conflict: "Ten termin został właśnie zajęty przez kogoś innego.",
  rate_limited: "W tej chwili mamy dużo oczekujących zgłoszeń. Spróbuj ponownie później.",
  server_error: "Coś się u nas popsuło. Spróbuj ponownie za chwilę.",
  unknown: "Nie udało się wykonać tej operacji. Spróbuj ponownie za chwilę.",
};

/** Zamienia dowolny wyjątek na zdanie, które można pokazać na ekranie. */
export function userMessage(error: unknown): string {
  if (isApiError(error)) return error.message || USER_MESSAGES[error.code];
  return USER_MESSAGES.unknown;
}
