"use client";

import { useEffect, useState } from "react";

/** Nazwa parametru z tokenem: /decision?t=… oraz /cancel?t=… */
export const TOKEN_PARAM = "t";

/**
 * Token wizyty odczytany z adresu.
 *
 * Strony decyzji i odwołania są eksportowane statycznie — jeden plik HTML
 * obsługuje wszystkie tokeny, więc token może przyjść tylko z przeglądarki.
 * Czytamy go z `window.location.search`, a nie przez `useSearchParams()`,
 * bo ten w eksporcie statycznym wymusza opakowanie strony w `<Suspense>`,
 * niczego tu nie wnosząc.
 *
 * Trzy stany, bo „jeszcze nie odczytany” to co innego niż „nie ma go w adresie”:
 *
 * - `undefined` — trwa odczyt (pierwszy render, jeszcze przed efektem)
 * - `null`      — w adresie nie ma parametru `t`
 * - `string`    — token gotowy do przekazania do serwisu
 */
export function useTokenFromUrl(): string | null | undefined {
  const [token, setToken] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get(TOKEN_PARAM);
    setToken(value && value.trim() ? value.trim() : null);
  }, []);

  return token;
}
