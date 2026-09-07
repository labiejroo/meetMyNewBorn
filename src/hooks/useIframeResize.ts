"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PARENT_ORIGIN,
  ZOJA_IFRAME_RESIZE,
  ZOJA_SCROLL_TO_EMBED,
  type ZojaChildMessage,
} from "@/lib/iframeMessages";

let originWarningShown = false;

function postToParent(message: ZojaChildMessage) {
  if (typeof window === "undefined" || window.parent === window) return;
  if (!PARENT_ORIGIN) {
    if (!originWarningShown && process.env.NODE_ENV !== "production") {
      originWarningShown = true;
      console.warn(
        '[zoja] NEXT_PUBLIC_PARENT_ORIGIN nie jest ustawione — postMessage pominięty. Wildcard "*" celowo nie jest używany.',
      );
    }
    return;
  }
  window.parent.postMessage(message, PARENT_ORIGIN);
}

/** Od tej szerokości uznajemy ekran za desktop — ta sama granica co breakpoint `sm`. */
const DESKTOP_QUERY = "(min-width: 640px)";

/**
 * Prosi rodzica o przewinięcie strony do sekcji z rezerwacją.
 *
 * TYLKO DESKTOP i tylko w ramce. Na telefonie modal jest arkuszem zakotwiczonym
 * do widocznego wycinka, więc przewijanie strony pod spodem tylko szarpałoby
 * widokiem. Poza ramką nie ma do kogo mówić — strona stoi samodzielnie.
 *
 * To, DOKĄD przewinąć, decyduje rodzic. Ramka sygnalizuje wyłącznie moment.
 */
export function requestScrollToEmbed(): void {
  if (typeof window === "undefined" || window.parent === window) return;
  if (!window.matchMedia(DESKTOP_QUERY).matches) return;
  postToParent({ type: ZOJA_SCROLL_TO_EMBED });
}

/** Czy apka jest w tej chwili osadzona w iframe. */
export function useIsEmbedded(): boolean {
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => setEmbedded(window.parent !== window), []);
  return embedded;
}

/**
 * Mierzy kontener treści i wysyła wysokość do rodzica.
 *
 * `ref` podłącz do elementu, który realnie rośnie razem z treścią — nie do
 * elementu z `min-h-screen`, bo w iframe 100vh równa się wysokości iframe
 * i wysokość przestałaby kiedykolwiek maleć.
 *
 * ResizeObserver łapie większość zmian sam (zmiana miesiąca, toast, inny
 * widok). `notify()` jest dla przypadków, w których wysokość ustala się dopiero
 * po przemalowaniu.
 */
export function useIframeResize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const lastHeight = useRef(-1);

  /**
   * `force` pomija deduplikację po wysokości.
   *
   * DLACZEGO TO JEST POTRZEBNE
   * Rodzic odsyła świeży `ZOJA_PARENT_VIEWPORT` w odpowiedzi na KAŻDĄ wiadomość
   * o wysokości. Modal jest pozycjonowany poza flow, więc jego otwarcie nie
   * zmienia mierzonej wysokości — bez `force` wiadomość nie poszłaby, rodzic
   * nie odesłałby wycinka, a overlay zostałby zakotwiczony do pozycji sprzed
   * przewinięcia. Modal był wtedy poza ekranem aż do przypadkowego zdarzenia
   * u rodzica (dotknięcie ekranu chowa pasek adresu → `resize`).
   */
  const send = useCallback((force = false) => {
    const el = ref.current;
    if (!el) return;
    const height = Math.ceil(el.getBoundingClientRect().height);
    if (height <= 0) return;
    if (!force && height === lastHeight.current) return;
    lastHeight.current = height;
    postToParent({ type: ZOJA_IFRAME_RESIZE, height });
  }, []);

  /**
   * Dwie klatki, żeby layout zdążył się ustawić po zmianie widoku, i `force`,
   * bo `notify()` woła się właśnie wtedy, gdy WIDOK się zmienił — nawet jeśli
   * wysokość została ta sama.
   */
  const notify = useCallback(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => send(true)));
  }, [send]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Owijamy w strzałki: ResizeObserver i `resize` przekazują argument,
    // który wpadłby na miejsce `force` i wymuszał wysyłkę przy każdym pomiarze.
    const observer = new ResizeObserver(() => send());
    const onResize = () => send();
    observer.observe(el);
    window.addEventListener("resize", onResize);
    send();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [send]);

  return { ref, notify };
}
