"use client";

import { useCallback, useEffect, useState } from "react";

import { ReservationSummary } from "@/components/decision/ReservationSummary";
import { Button } from "@/components/ui/Button";
import { PageShell } from "@/components/ui/PageShell";
import { ErrorState, LoadingState, ResultPanel } from "@/components/ui/States";
import { useTokenFromUrl } from "@/hooks/useTokenFromUrl";
import { cancelReservation, getCancellation } from "@/services/reservationService";
import { userMessage } from "@/types";
import type { CancellationResponse } from "@/types";

/**
 * Strona z linku do odwołania wizyty: /cancel?t=<token>
 *
 * Tak samo jak przy decyzji rodziców: GET tylko pokazuje informacje,
 * odwołanie wykonuje dopiero POST po kliknięciu przycisku.
 */
export default function CancelPage() {
  const token = useTokenFromUrl();

  const [cancellation, setCancellation] = useState<CancellationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setCancellation(await getCancellation(token));
    } catch (caught) {
      setError(userMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel() {
    if (busy || !token) return;
    setBusy(true);
    setActionError(null);
    try {
      setCancellation(await cancelReservation(token));
      setConfirming(false);
    } catch (caught) {
      setActionError(userMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  const revision = `${token}-${loading}-${cancellation?.status ?? ""}-${confirming}-${error ?? ""}-${actionError ?? ""}`;

  const header = (
    <header className="flex flex-col gap-2 px-0.5">
      <p className="m-0 text-[11px] uppercase tracking-[.16em] text-muted">Odwołanie wizyty</p>
      <h1 className="m-0 font-serif text-[26px] font-medium leading-[1.12] tracking-[-0.01em] [text-wrap:pretty] sm:text-[36px]">
        Odwiedziny u Zoi
      </h1>
    </header>
  );

  // Token czytamy dopiero w przeglądarce — do tego czasu nie ma czego pokazywać.
  if (token === undefined) {
    return (
      <PageShell revision="czytanie-tokenu">
        {header}
        <LoadingState label="Otwieranie linku…" />
      </PageShell>
    );
  }

  if (token === null) {
    return (
      <PageShell revision="brak-tokenu">
        {header}
        <ErrorState
          title="Ten link jest niekompletny"
          message="Brakuje w nim części, która wskazuje na konkretną wizytę. Otwórzcie, proszę, link z maila w całości, najlepiej klikając w niego, a nie przepisując ręcznie."
        />
      </PageShell>
    );
  }

  return (
    <PageShell revision={revision}>
      {header}

      {loading && <LoadingState label="Ładowanie szczegółów wizyty…" />}

      {!loading && error && (
        <ErrorState title="Nie udało się otworzyć tego linku" message={error} onRetry={load} />
      )}

      {!loading && !error && cancellation && (
        <>
          {cancellation.status === "cancelled" ? (
            <ResultPanel tone="neutral" eyebrow="Gotowe" title="Ta wizyta została odwołana.">
              <p className="m-0 max-w-[52ch] text-[14.5px] leading-relaxed text-ink2 [text-wrap:pretty]">
                Termin wrócił do puli wolnych weekendów. Ktoś inny może go teraz wybrać.
                Jeśli odwołanie było pomyłką, napiszcie do nas, a umówimy się jeszcze raz.
              </p>
            </ResultPanel>
          ) : !cancellation.canCancel ? (
            <ResultPanel tone="neutral" eyebrow="Nic do zrobienia" title="Tej wizyty nie da się już odwołać.">
              <p className="m-0 max-w-[52ch] text-[14.5px] leading-relaxed text-ink2 [text-wrap:pretty]">
                Termin już minął albo zgłoszenie zostało wcześniej zamknięte. Jeśli coś się nie zgadza,
                napiszcie do nas, poprawimy to ręcznie.
              </p>
            </ResultPanel>
          ) : (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 rounded-2xl border border-line bg-card px-5 py-4">
                <h2 className="m-0 font-serif text-[21px] font-medium leading-snug [text-wrap:pretty] sm:text-[26px]">
                  Chcecie odwołać tę wizytę?
                </h2>
                <p className="m-0 text-[14px] leading-relaxed text-ink2 [text-wrap:pretty]">
                  Nic się nie stanie, dopóki nie klikniecie przycisku. Po odwołaniu termin wróci
                  do puli i ktoś inny będzie mógł go wybrać.
                </p>
              </div>

              <ReservationSummary
                dateStart={cancellation.dateStart}
                dateEnd={cancellation.dateEnd}
                guestName={cancellation.guestName}
                arrivalDay={cancellation.arrivalDay}
              />

              {actionError && <ErrorState title="Nie udało się odwołać wizyty" message={actionError} />}

              {confirming ? (
                <div className="flex flex-col gap-2.5 rounded-2xl border border-[rgba(196,104,92,.5)] bg-[rgba(196,104,92,.09)] px-5 py-4">
                  <strong className="text-[14.5px] font-semibold text-terraInk [text-wrap:pretty]">
                    Na pewno? Tego nie da się cofnąć samodzielnie.
                  </strong>
                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <Button
                      variant="danger"
                      fullWidth
                      onClick={cancel}
                      loading={busy}
                      loadingLabel="Odwoływanie…"
                    >
                      Tak, odwołuję wizytę
                    </Button>
                    <Button variant="secondary" fullWidth onClick={() => setConfirming(false)} disabled={busy}>
                      Zostawiam termin
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="danger" onClick={() => setConfirming(true)}>
                  Odwołuję wizytę
                </Button>
              )}
            </section>
          )}
        </>
      )}
    </PageShell>
  );
}
