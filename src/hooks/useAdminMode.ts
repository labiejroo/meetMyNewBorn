"use client";

import { useCallback, useEffect, useState } from "react";

const ADMIN_FLAG = "zoja-admin";

/**
 * Tryb gospodarzy włącza wejście pod adres z `?zoja`; flaga zostaje
 * w sessionStorage na czas karty.
 *
 * To NIE jest zabezpieczenie — parametr w adresie każdy może dopisać.
 * Uprawnienia weryfikuje backend przy każdym wywołaniu; tutaj tylko
 * decydujemy, co pokazać na ekranie.
 *
 * W iframe tryb gospodarzy jest wyłączony: apka jest osadzona na stronie
 * rodzinnej, do której dostęp mają wszyscy zaproszeni.
 */
export function useAdminMode() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const embedded = window.parent !== window;

    if (embedded) {
      try {
        window.sessionStorage.removeItem(ADMIN_FLAG);
      } catch {
        // Brak dostępu do sessionStorage — i tak zostajemy w trybie gościa.
      }
      setIsAdmin(false);
      setResolved(true);
      return;
    }

    let active = false;
    try {
      if (new URLSearchParams(window.location.search).has("zoja")) {
        window.sessionStorage.setItem(ADMIN_FLAG, "1");
      }
      active = window.sessionStorage.getItem(ADMIN_FLAG) === "1";
    } catch {
      // Prywatne okno: tryb działa tylko dopóki parametr jest w adresie.
      active = new URLSearchParams(window.location.search).has("zoja");
    }

    setIsAdmin(active);
    setResolved(true);
  }, []);

  const exitAdmin = useCallback(() => {
    try {
      window.sessionStorage.removeItem(ADMIN_FLAG);
    } catch {
      // nic — i tak gasimy flagę w stanie
    }
    setIsAdmin(false);
  }, []);

  return { isAdmin, exitAdmin, resolved };
}
