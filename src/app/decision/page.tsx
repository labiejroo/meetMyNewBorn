"use client";

import { useEffect, useState } from "react";

import { ReservationSummary } from "@/components/decision/ReservationSummary";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";
import { ErrorState, LoadingState, ResultPanel } from "@/components/ui/States";
import { useDecisionLink } from "@/hooks/useDecisionLink";
import { previewDecision, submitDecision } from "@/services/decisionActionService";
import { isApiError, userMessage } from "@/types";
import type { ApiDecisionPreview, ApiDecisionResult } from "@/types";

/**
 * Strona z linku, który rodzice dostają mailem:
 *
 *     /decision#action=confirm&token=…
 *     /decision#action=reject&token=…
 *
 * SAMO WEJŚCIE NIE ZMIENIA NICZEGO.
 *
 * To jest najważniejsza własność tego ekranu, nie szczegół implementacji.
 * Skanery odnośników w klientach pocztowych i w bramkach antyspamowych
 * otwierają linki z wiadomości samodzielnie, zanim człowiek ją przeczyta.
 * Gdyby decyzja zapadała przy wejściu, taki skaner potwierdzałby wizyty
 * za rodziców.
 *
 * Dlatego przy montowaniu leci wyłącznie preview, który po stronie backendu
 * jest operacją czysto odczytową. Status zmienia dopiero osobne żądanie
 * wysłane z obsługi kliknięcia w przycisk.
 *
 * Token żyje tylko w stanie tego komponentu — nigdy w localStorage,
 * sessionStorage ani w ciasteczku — i znika z paska adresu zaraz po odczycie.
 */
export default function DecisionPage() {
  const link = useDecisionLink();

  /**
   * Token trzymamy w osobnym stanie, zamiast sięgać po link.token przy wysyłce.
   * Po udanej decyzji ustawiamy go na null i to jest jednocześnie blokada
   * drugiego wysłania: nie ma już czym.
   */
  const [token, setToken] = useState<string | null>(null);

  const [preview, setPreview] = useState<ApiDecisionPreview | null>(null);
  const [result, setResult] = useState<ApiDecisionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    // Fragment jeszcze nieodczytany — nie ma o co pytać.
    if (link === undefined) return;

    if (link === null) {
      setLoading(false);
      return;
    }

    setToken(link.token);

    let cancelled = false;

    void (async () => {
      try {
        const data = await previewDecision(link.token);
        if (!cancelled) setPreview(data);
      } catch (caught) {
        if (!cancelled) setLoadError(caught);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [link]);

  /** Wywoływane WYŁĄCZNIE z kliknięcia. Nigdy z efektu. */
  async function decide() {
    if (!link || !token || submitting || result) return;

    setSubmitting(true);
    setActionError(null);

    try {
      const outcome = await submitDecision(link.action, token);
      setResult(outcome);
      // Token zużyty — po stronie backendu też już nie istnieje.
      setToken(null);
    } catch (caught) {
      setActionError(userMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  const confirming = link?.action === "confirm";

  const revision = [
    link === undefined ? "czekam" : (link?.action ?? "brak"),
    loading,
    preview?.reservationId ?? "",
    result?.status ?? "",
    actionError ?? "",
  ].join("-");

  const header = (
    <header className="flex flex-col gap-2 px-0.5">
      <p className="m-0 text-[11px] uppercase tracking-[.16em] text-muted">Decyzja o wizycie</p>
      <h1 className="m-0 font-serif text-[26px] font-medium leading-[1.12] tracking-[-0.01em] [text-wrap:pretty] sm:text-[36px]">
        Odwiedziny u Zoi
      </h1>
    </header>
  );

  // Fragment adresu czytamy dopiero w przeglądarce — do tego czasu nie ma czego
  // pokazywać. Strona jest eksportowana statycznie, więc jeden plik HTML
  // obsługuje wszystkie linki.
  if (link === undefined) {
    return (
      <PageShell revision="czytanie-linku">
        {header}
        <LoadingState label="Otwieranie linku…" />
      </PageShell>
    );
  }

  if (link === null) {
    return (
      <PageShell revision="brak-linku">
        {header}
        <ErrorState
          title="Ten link jest niekompletny"
          message="Brakuje w nim części, która wskazuje na konkretną prośbę o wizytę. Otwórzcie, proszę, link z maila w całości — najlepiej klikając w niego, a nie przepisując ręcznie."
        />
      </PageShell>
    );
  }

  if (loading) {
    return (
      <PageShell revision={revision}>
        {header}
        <LoadingState label="Ładowanie szczegółów prośby…" />
      </PageShell>
    );
  }

  /**
   * Backend odpowiada tu dwiema różnymi sytuacjami i tylko te dwie rozróżniamy:
   *
   *   410 — link BYŁ prawidłowy, ale minęło siedem dni
   *   404 — nieznany albo już zużyty; jedno zdanie na oba, żeby odpowiedź nie
   *         zdradzała, czy trafiono w istniejącą rezerwację
   *
   * Treść bierzemy z komunikatu backendu, więc oba miejsca mówią to samo.
   * Surowego JSON-a nie pokazujemy nigdy.
   */
  if (loadError) {
    const expired = isApiError(loadError) && loadError.status === 410;

    return (
      <PageShell revision={revision}>
        {header}
        <ErrorState
          title={expired ? "Ten link wygasł" : "Ten link już nie działa"}
          message={userMessage(loadError)}
        />
      </PageShell>
    );
  }

  if (!preview) {
    return (
      <PageShell revision={revision}>
        {header}
        <ErrorState
          title="Ten link już nie działa"
          message="Ten link jest nieprawidłowy lub został już wykorzystany."
        />
      </PageShell>
    );
  }

  return (
    <PageShell revision={revision}>
      {header}

      {result ? (
        <section className="flex flex-col gap-4">
          <ResultPanel
            tone={result.status === "CONFIRMED" ? "success" : "neutral"}
            eyebrow="Decyzja zapisana"
            title={result.message}
          >
            <p className="m-0 max-w-[52ch] text-[14.5px] leading-relaxed text-ink2 [text-wrap:pretty]">
              {result.status === "CONFIRMED"
                ? "Gość dostanie maila z potwierdzeniem. Ten link możecie już zamknąć — przestał działać."
                : "Gość dostanie maila z informacją. Termin wrócił do puli wolnych weekendów, a ten link przestał działać."}
            </p>
          </ResultPanel>

          <ReservationSummary
            dateStart={preview.dateStart}
            dateEnd={preview.dateEnd}
            guestName={preview.guestName}
            guestEmail={preview.guestEmail}
            arrivalDay={preview.arrivalDay}
            notes={preview.notes}
          />
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-2xl border border-[rgba(217,164,65,.55)] bg-[rgba(217,164,65,.14)] px-5 py-4">
            <h2 className="m-0 font-serif text-[21px] font-medium leading-snug [text-wrap:pretty] sm:text-[26px]">
              {confirming ? "Czy potwierdzacie tę wizytę?" : "Czy odrzucacie tę prośbę?"}
            </h2>
            <p className="m-0 text-[14px] leading-relaxed text-mustardInk [text-wrap:pretty]">
              Dopóki nie klikniecie przycisku, nic się nie dzieje. Gość widzi prośbę jako
              oczekującą.
            </p>
          </div>

          <ReservationSummary
            dateStart={preview.dateStart}
            dateEnd={preview.dateEnd}
            guestName={preview.guestName}
            guestEmail={preview.guestEmail}
            arrivalDay={preview.arrivalDay}
            notes={preview.notes}
          />

          {actionError && <ErrorState title="Nie udało się zapisać decyzji" message={actionError} />}

          {/*
            JEDEN przycisk, zgodny z akcją z linku. Rodzice kliknęli już
            Potwierdź albo Odrzuć w mailu — pokazanie tu obu możliwości
            zamieniałoby świadomy wybór w kolejne pytanie o to samo.
          */}
          <Button
            fullWidth
            variant={confirming ? "primary" : "secondary"}
            onClick={decide}
            loading={submitting}
            loadingLabel="Zapisywanie decyzji…"
          >
            {confirming ? "Potwierdź rezerwację" : "Odrzuć rezerwację"}
          </Button>
        </section>
      )}
    </PageShell>
  );
}
