"use client";

import { useEffect, useRef, useState } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/** Musi zgadzać się z TURNSTILE_EXPECTED_ACTION po stronie weryfikatora. */
const ACTION = "reservation_create";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action?: string;
      appearance?: "always" | "execute" | "interaction-only";
      size?: "normal" | "compact" | "flexible";
      theme?: "auto" | "light" | "dark";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      "timeout-callback"?: () => void;
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Skrypt ładujemy DOKŁADNIE RAZ na całą kartę.
 *
 * Obietnica żyje w module, nie w komponencie — modal potrafi otwierać się
 * i zamykać wiele razy w jednej sesji, a każde zamontowanie znacznika wewnątrz
 * warunkowo renderowanego drzewa to kolejna okazja do dołożenia drugiego.
 * Tutaj drugie wywołanie dostaje tę samą obietnicę.
 */
let scriptPromise: Promise<void> | undefined;

function loadTurnstileScript(): Promise<void> {
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("turnstile-script")));
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("turnstile-script"));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

type State = "loading" | "ready" | "solved" | "expired" | "error" | "unconfigured";

interface Props {
  /** Token po rozwiązaniu wyzwania; null gdy przepadł albo jeszcze go nie ma. */
  onToken: (token: string | null) => void;
  /**
   * Zmiana wartości wymusza świeże wyzwanie.
   *
   * Token Cloudflare jest JEDNORAZOWY: po próbie wysłania, która dotarła do
   * weryfikacji, nie da się go użyć ponownie. Modal zostaje otwarty po błędzie
   * (zajęty termin, awaria, odmowa), więc bez wymuszonego resetu druga próba
   * poleciałaby ze zużytym tokenem i odbiła się jako duplikat.
   */
  resetKey: number;
}

/**
 * Cloudflare Turnstile — jawne renderowanie.
 *
 * Renderujemy sami, zamiast pozwolić skryptowi znaleźć element po klasie:
 * formularz jest dynamicznym modalem, a my potrzebujemy kontroli nad tym,
 * KIEDY widget powstaje, i możliwości zresetowania go po nieudanej próbie.
 *
 * Token żyje wyłącznie w pamięci Reacta — nie ląduje w localStorage,
 * sessionStorage, adresie ani we własnym ciasteczku. Jest jednorazowym
 * poświadczeniem, nie preferencją wartą zapamiętania.
 */
export function TurnstileField({ onToken, resetKey }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);

  const [state, setState] = useState<State>(SITE_KEY ? "loading" : "unconfigured");

  // Callback trzymamy w ref, żeby zmiana funkcji w komponencie nadrzędnym nie
  // powodowała ponownego renderowania widgetu i utraty rozwiązanego wyzwania.
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    /**
     * BEZ KLUCZA NIE BLOKUJEMY FORMULARZA.
     *
     * Lokalnie i w buildach bez skonfigurowanego sitekey widget nie ma jak
     * powstać. Gdyby jego brak blokował wysyłkę, każdy development wymagałby
     * konta Cloudflare. Backend i tak decyduje osobno: przy TURNSTILE_ENABLED
     * żądanie bez tokenu zostanie odrzucone niezależnie od tego, co pokazuje
     * przeglądarka.
     */
    if (!SITE_KEY) {
      onTokenRef.current(null);
      return;
    }

    let cancelled = false;

    void loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;

        // Poprzedni widget usuwamy, zanim postawimy nowy — inaczej przy zmianie
        // resetKey zostałyby dwa, a Cloudflare liczy je osobno.
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // Widget mógł już zniknąć razem z DOM-em. Nic tu nie ratujemy.
          }
          widgetIdRef.current = null;
        }

        containerRef.current.innerHTML = "";

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          // Ta sama wartość sprawdzana po stronie serwera. Bez niej token
          // z innego formularza dałby się tu przenieść.
          action: ACTION,
          /**
           * Widget widoczny ZAWSZE, także wtedy, gdy Cloudflare nie potrzebuje
           * żadnej interakcji — gość zobaczy ramkę z „Zweryfikowano".
           *
           * Alternatywą jest "interaction-only": ochrona działa identycznie,
           * ale nie widać jej wcale. Wybraliśmy wersję widoczną, żeby dało się
           * gołym okiem stwierdzić, że zabezpieczenie żyje; bez tego jedynym
           * sposobem sprawdzenia są logi CloudWatch albo konsola przeglądarki.
           *
           * POWRÓT TO JEDNO SŁOWO. Jeśli ramka okaże się zawadzać gościom —
           * a adresatami są dziadkowie, dla których każdy dodatkowy element
           * formularza to kolejna rzecz do rozważenia — wystarczy wpisać tu
           * "interaction-only" i przebudować frontend. Nic poza tym.
           */
          appearance: "always",
          size: "flexible",
          theme: "auto",
          callback: (token: string) => {
            if (cancelled) return;
            setState("solved");
            onTokenRef.current(token);
          },
          "expired-callback": () => {
            if (cancelled) return;
            // Token przepadł. Kasujemy go u siebie, żeby nie wysłać zużytego.
            setState("expired");
            onTokenRef.current(null);
          },
          "timeout-callback": () => {
            if (cancelled) return;
            setState("expired");
            onTokenRef.current(null);
          },
          "error-callback": () => {
            if (cancelled) return;
            setState("error");
            onTokenRef.current(null);
          },
        });

        setState((current) => (current === "loading" ? "ready" : current));
      })
      .catch(() => {
        if (!cancelled) {
          setState("error");
          onTokenRef.current(null);
        }
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // jw.
        }
        widgetIdRef.current = null;
      }
    };
  }, [resetKey]);

  // Bez klucza nie pokazujemy nic — pusty blok w formularzu tylko by mylił.
  if (state === "unconfigured") return null;

  return (
    <div className="flex flex-col gap-2">
      <div ref={containerRef} data-turnstile />

      {(state === "error" || state === "expired") && (
        <p className="m-0 text-[13px] leading-snug text-[#a4433c]" role="alert">
          {state === "expired"
            ? "Sprawdzenie wygasło. Za chwilę powtórzymy je automatycznie."
            : "Nie udało się potwierdzić, że formularz wysyła człowiek. Spróbuj ponownie."}
        </p>
      )}
    </div>
  );
}
