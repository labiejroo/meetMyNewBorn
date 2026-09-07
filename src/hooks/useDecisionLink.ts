"use client";

import { useEffect, useRef, useState } from "react";

/** Jedyne akcje, jakie link z maila może zamówić. */
export type DecisionAction = "confirm" | "reject";

export interface DecisionLink {
  action: DecisionAction;
  token: string;
}

/**
 * Odczyt linku decyzyjnego: /decision#action=confirm&token=…
 *
 * DLACZEGO FRAGMENT, A NIE QUERY STRING
 * Wszystko po `#` zostaje w przeglądarce — nie jest wysyłane w żądaniu HTTP.
 * Token nie trafia więc do logów CloudFrontu, do nagłówka Referer ani do
 * żadnego serwera po drodze. W query stringu trafiłby wszędzie tam naraz,
 * a raz zapisanego tokenu nie da się już wycofać.
 *
 * Trzy stany, bo „jeszcze nie odczytany” to co innego niż „nie ma go w adresie”:
 *
 * - `undefined` — trwa odczyt (pierwszy render, przed efektem)
 * - `null`      — brak akcji albo tokenu, albo akcja spoza dozwolonych
 * - obiekt      — komplet gotowy do wysłania
 *
 * Token żyje WYŁĄCZNIE w stanie Reacta. Świadomie nie ląduje w localStorage,
 * sessionStorage ani w ciasteczku: jest jednorazowym poświadczeniem rodziców,
 * a nie preferencją, którą warto pamiętać. Zamknięcie karty ma go zabrać.
 */
export function useDecisionLink(): DecisionLink | null | undefined {
  const [link, setLink] = useState<DecisionLink | null | undefined>(undefined);

  /**
   * Fragment czytamy DOKŁADNIE RAZ.
   *
   * Zaraz po odczycie kasujemy go z paska adresu, więc drugie wejście w ten sam
   * efekt zastałoby już pusty hash. W trybie deweloperskim React montuje
   * komponent dwa razy — bez tej pamiątki token znikałby przy każdym
   * uruchomieniu `next dev`.
   */
  const parsed = useRef<{ value: DecisionLink | null } | null>(null);

  useEffect(() => {
    if (parsed.current) {
      setLink(parsed.current.value);
      return;
    }

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const action = params.get("action");
    const token = params.get("token")?.trim();

    const value: DecisionLink | null =
      (action === "confirm" || action === "reject") && token ? { action, token } : null;

    parsed.current = { value };
    setLink(value);

    if (value) {
      /**
       * Token znika z paska adresu, ale zostaje w pamięci komponentu.
       *
       * Chodzi o to, żeby nie został w historii przeglądarki, w podglądzie
       * ostatnich kart ani na ekranie pokazanym komuś przez ramię. Sama decyzja
       * jest dalej możliwa, bo pracujemy już na wartości ze stanu.
       */
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  return link;
}
