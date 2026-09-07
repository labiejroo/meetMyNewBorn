"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getAdminSession, loginAdmin, logoutAdmin } from "@/services/adminAuthService";

/**
 * Stan zalogowania gospodarzy.
 *
 * ŹRÓDŁEM PRAWDY JEST BACKEND, nie przeglądarka. Hook trzyma wyłącznie wynik
 * ostatniej odpowiedzi serwera i nie zapisuje niczego trwale — ani hasła, ani
 * żadnego tokenu. Sesja żyje w ciasteczku HttpOnly, którego ten kod nie widzi.
 *
 * To jest istotne rozróżnienie względem useAdminMode: tamten mówi, czy
 * użytkownik CHCE widzieć tryb gospodarzy (parametr ?zoja), ten mówi, czy
 * WOLNO mu cokolwiek zrobić. Pierwsze jest preferencją zapisaną
 * w sessionStorage, drugie decyzją serwera. Mylenie ich było dokładnie tym
 * błędem, który naprawiamy.
 */
/**
 * `enabled` odracza sprawdzenie sesji do chwili, gdy jest po co pytać.
 * Strona główna jest publiczna i odwiedzana głównie przez gości — bez tego
 * każde wejście babci wysyłałoby żądanie do panelu, którego ona nigdy nie
 * otworzy.
 */
export function useAdminAuth({ enabled = true }: { enabled?: boolean } = {}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  /** Chroni przed lawiną zapytań, gdy komponent przerenderuje się w trakcie. */
  const pending = useRef(false);

  const refreshSession = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;

    try {
      const state = await getAdminSession();
      setAuthenticated(state.authenticated);
    } catch {
      // Brak odpowiedzi traktujemy jak brak sesji. Nie ma tu czego ponawiać:
      // przy prawdziwej awarii pętla zapytań tylko pogorszyłaby sprawę.
      setAuthenticated(false);
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }, []);

  // Jedno sprawdzenie, gdy tryb gospodarzy staje się aktywny. Nie przy
  // każdym renderze i nie na stronie oglądanej przez gościa.
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void refreshSession();
  }, [enabled, refreshSession]);

  const login = useCallback(async (password: string) => {
    const state = await loginAdmin(password);
    setAuthenticated(state.authenticated);
    return state.authenticated;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutAdmin();
    } finally {
      // Nawet gdy żądanie padło, lokalnie przestajemy uważać się za
      // zalogowanych — inaczej użytkownik zostałby w stanie, z którego
      // nie da się wyjść.
      setAuthenticated(false);
    }
  }, []);

  /**
   * Wywoływane, gdy dowolne żądanie do panelu odbije się o 401. Sesja mogła
   * wygasnąć między jednym kliknięciem a drugim.
   */
  const markUnauthenticated = useCallback(() => {
    setAuthenticated(false);
  }, []);

  return { authenticated, loading, login, logout, refreshSession, markUnauthenticated };
}
