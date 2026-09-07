"use client";

import { useEffect, useState } from "react";
import { PARENT_ORIGIN, isParentViewportMessage } from "@/lib/iframeMessages";

export interface ParentViewport {
  /** Ile px iframe jest przewinięte ponad górną krawędź okna rodzica. */
  offsetTop: number;
  /** Wysokość widocznego wycinka iframe. */
  viewportHeight: number;
}

/**
 * Nasłuchuje, którą część iframe widzi w tej chwili użytkownik.
 * Zwraca `null`, dopóki rodzic nic nie przysłał (albo apka działa samodzielnie)
 * — wtedy modal zostaje przy zwykłym `position: fixed`.
 */
export function useParentViewport(): ParentViewport | null {
  const [viewport, setViewport] = useState<ParentViewport | null>(null);

  useEffect(() => {
    if (window.parent === window || !PARENT_ORIGIN) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== PARENT_ORIGIN) {
        // Cichy rozjazd originu potrafi kosztowac godziny: wiadomosci plyna,
        // ale wszystkie ladują w koszu, a modal ustawia sie w srodku bardzo
        // wysokiej ramki. W deweloperce mowimy o tym glosno.
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[zoja] Wiadomosc od " + event.origin + " odrzucona - oczekiwano " +
              PARENT_ORIGIN + ". Sprawdz NEXT_PUBLIC_PARENT_ORIGIN.",
          );
        }
        return;
      }
      if (event.source !== window.parent) return;
      if (!isParentViewportMessage(event.data)) return;
      setViewport({
        offsetTop: Math.max(0, event.data.offsetTop),
        viewportHeight: Math.max(0, event.data.viewportHeight),
      });
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return viewport;
}
