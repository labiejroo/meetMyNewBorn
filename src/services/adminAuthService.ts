import { adminApiIsLive, mockCall, request } from "./http";

/**
 * LOGOWANIE GOSPODARZY.
 *
 * Frontend NIE ZNA wartości sesji i nigdy jej nie dotyka. Backend wystawia
 * ciasteczko HttpOnly, którego JavaScript nie odczyta — przeglądarka dołącza
 * je sama do żądań na /api/admin. Dzięki temu nawet udany XSS na tej stronie
 * nie ma czego wynieść.
 *
 * Z tego samego powodu nie ma tu żadnego zapisu do localStorage,
 * sessionStorage ani do własnego ciasteczka. Jedynym stanem jest odpowiedź
 * backendu na pytanie „czy jestem zalogowany?”.
 */

export interface AdminAuthState {
  authenticated: boolean;
}

/**
 * Na mockach panel ma działać bez backendu — tak samo jak reszta aplikacji
 * w `next dev`. To NIE jest obejście: przy podłączonym API decyduje wyłącznie
 * odpowiedź serwera, a tryb mockowy nie istnieje na produkcji.
 */
const MOCK_STATE: AdminAuthState = { authenticated: true };

export async function loginAdmin(password: string): Promise<AdminAuthState> {
  if (!adminApiIsLive) return mockCall(() => MOCK_STATE, 500);

  return request<AdminAuthState>("/api/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

/**
 * Ciche sprawdzenie sesji. Backend odpowiada 200 także dla niezalogowanego,
 * więc brak sesji nie jest tu błędem i nie zostawia czerwieni w konsoli.
 */
export async function getAdminSession(): Promise<AdminAuthState> {
  if (!adminApiIsLive) return mockCall(() => MOCK_STATE, 200);

  return request<AdminAuthState>("/api/admin/auth/session", { method: "GET" });
}

export async function logoutAdmin(): Promise<AdminAuthState> {
  if (!adminApiIsLive) return mockCall(() => ({ authenticated: false }), 200);

  return request<AdminAuthState>("/api/admin/auth/logout", { method: "POST" });
}
