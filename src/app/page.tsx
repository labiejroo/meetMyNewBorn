"use client";

import Link from "next/link";
import { useState } from "react";

import { Legend } from "@/components/calendar/Legend";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { TermList } from "@/components/calendar/TermList";
import { BookingModal } from "@/components/reservation/BookingModal";
import { SubmittedScreen } from "@/components/reservation/SubmittedScreen";
import { DevPanel } from "@/components/ui/DevPanel";
import { PageShell } from "@/components/ui/PageShell";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Toasts } from "@/components/ui/Toasts";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useCalendar } from "@/hooks/useCalendar";
import { useToasts } from "@/hooks/useToasts";
import { addDays, formatRange, todayIso } from "@/lib/dates";
import { arrivalLabel } from "@/lib/status";
import type { ArrivalDay, CreateReservationResult } from "@/types";

interface Picked {
  saturday: string;
  sunday: string;
  arrival: ArrivalDay;
}

export default function Page() {
  const { calendar, loading, error, reload, weekendAt, termAt } = useCalendar();
  const { toasts, push, dismiss } = useToasts();
  const { isAdmin } = useAdminMode();

  // Tryb gospodarzy ODSŁANIA panel, sesja go OTWIERA. Dwie różne rzeczy:
  // pierwsza jest preferencją w sessionStorage, druga decyzją backendu.
  const { authenticated, loading: authLoading, login } = useAdminAuth({ enabled: isAdmin });

  const [month, setMonth] = useState(() => todayIso().slice(0, 7));
  const [picked, setPicked] = useState<Picked | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState<CreateReservationResult | null>(null);

  function openWeekend(saturday: string, arrival: ArrivalDay) {
    setPicked({ saturday, sunday: addDays(saturday, 1), arrival });
    setModalOpen(true);
  }

  function onCreated(result: CreateReservationResult) {
    setModalOpen(false);
    setPicked(null);
    setSubmitted(result);
    push("success", "Zgłoszenie wysłane, czeka na potwierdzenie rodziców.");
    void reload();
  }

  // Każda zmiana widoku wymusza ponowny pomiar wysokości iframe.
  const revision = `${month}-${modalOpen}-${submitted?.reservationId ?? ""}-${loading}-${toasts.length}-${picked?.saturday ?? ""}`;

  if (submitted) {
    return (
      <PageShell revision={revision}>
        <SubmittedScreen result={submitted} onBack={() => setSubmitted(null)} />
        <Toasts toasts={toasts} onClose={dismiss} />
      </PageShell>
    );
  }

  return (
    <PageShell revision={revision}>
      <header className="flex flex-col gap-3 px-0.5">
        <p className="m-0 text-[11px] uppercase tracking-[.16em] text-muted">Rezerwacja odwiedzin</p>
        <h1 className="m-0 font-serif text-[26px] font-medium leading-[1.12] tracking-[-0.01em] [text-wrap:pretty] sm:text-[40px]">
          Apka do rezerwacji pierwszych odwiedzin naszej córki Zoi
        </h1>
        <p className="m-0 max-w-[52ch] text-[15px] leading-relaxed text-[#6E6259] [text-wrap:pretty]">
          Wybierzcie termin, który Wam pasuje. Damy znać mailem, kiedy będzie potwierdzony.
        </p>
        <p className="m-0 mt-0.5 text-[13.5px] font-semibold leading-relaxed tracking-[.01em] text-accentHover">
          Rezerwujemy całe weekendy, sobota i niedziela zawsze razem. Dni roboczych nie da się wybrać.
        </p>
      </header>

      {isAdmin && authLoading && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[rgba(201,139,132,.45)] bg-[rgba(201,139,132,.10)] px-[18px] py-3.5">
          <span className="text-[13.5px] font-medium text-muted">Sprawdzanie trybu gospodarzy…</span>
        </div>
      )}

      {isAdmin && !authLoading && !authenticated && <AdminLoginForm onLogin={login} />}

      {isAdmin && !authLoading && authenticated && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[rgba(201,139,132,.45)] bg-[rgba(201,139,132,.10)] px-[18px] py-3.5">
          <span className="text-[13.5px] font-semibold text-terraInk">Tryb gospodarzy włączony</span>
          <Link
            href="/admin"
            className="ml-auto min-h-[44px] text-[13.5px] font-semibold text-accentHover underline underline-offset-[3px]"
          >
            Otwórz panel →
          </Link>
        </div>
      )}

      <Legend />

      {loading && <LoadingState label="Ładowanie terminów…" />}

      {!loading && error && (
        <ErrorState title="Nie udało się wczytać kalendarza" message={error} onRetry={reload} />
      )}

      {!loading && !error && calendar && (
        <>
          <MonthGrid
            month={month}
            setMonth={setMonth}
            minMonth={calendar.rangeStart.slice(0, 7)}
            maxMonth={calendar.rangeEnd.slice(0, 7)}
            admin={false}
            picked={picked ? { saturday: picked.saturday, arrival: picked.arrival } : null}
            weekendAt={weekendAt}
            termAt={termAt}
            onOpenWeekend={openWeekend}
            onOpenTerm={() => undefined}
          />

          {picked && !modalOpen && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-2xl border border-[rgba(201,139,132,.45)] bg-[rgba(201,139,132,.10)] px-[18px] py-3.5">
              <div className="flex flex-col gap-[3px]">
                <strong className="text-[14px] font-semibold">
                  {formatRange(picked.saturday, picked.sunday)}
                </strong>
                <span className="text-[12.5px] text-[#8A6B66]">
                  {arrivalLabel(picked.arrival)}, rezerwujecie oba dni
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="ml-auto min-h-[44px] text-[13px] font-semibold text-accentHover underline underline-offset-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                otwórz formularz
              </button>
            </div>
          )}

          <TermList
            weekends={calendar.weekends}
            terms={calendar.terms}
            admin={false}
            onOpenWeekend={openWeekend}
            onOpenTerm={() => undefined}
          />
        </>
      )}

      <DevPanel onReset={() => void reload()} />

      {modalOpen && picked && (
        <BookingModal
          saturday={picked.saturday}
          sunday={picked.sunday}
          initialArrival={picked.arrival}
          onClose={() => setModalOpen(false)}
          onCreated={onCreated}
          onError={(message, code) => {
            push("error", message);
            // Najczęstsza przyczyna konfliktu to zmiana stanu terminu między
            // otwarciem formularza a kliknięciem — pokazujemy świeży kalendarz.
            if (code === "conflict") void reload();
          }}
        />
      )}

      <Toasts toasts={toasts} onClose={dismiss} />
    </PageShell>
  );
}
