"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AdminCreateForm } from "@/components/admin/AdminCreateForm";
import { AdminReservationList } from "@/components/admin/AdminReservationList";
import { ReservationEditor } from "@/components/admin/ReservationEditor";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { DevPanel } from "@/components/ui/DevPanel";
import { PageShell } from "@/components/ui/PageShell";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Toasts } from "@/components/ui/Toasts";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminCalendar } from "@/hooks/useAdminCalendar";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useToasts } from "@/hooks/useToasts";
import { addDays, todayIso } from "@/lib/dates";
import { getAdminReservations } from "@/services/adminService";
import { isApiError, userMessage } from "@/types";
import type { AdminReservation, CalendarTerm } from "@/types";

/** Dokąd odsyłamy każdego, kto nie ma ważnej sesji. */
const ENTRY_PATH = "/?zoja";

export default function AdminPage() {
  const router = useRouter();
  const { exitAdmin } = useAdminMode();
  const { authenticated, loading: authLoading, logout, markUnauthenticated } = useAdminAuth();
  const { toasts, push, dismiss } = useToasts();

  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [editing, setEditing] = useState<AdminReservation | null>(null);
  const [month, setMonth] = useState(() => todayIso().slice(0, 7));
  const [preset, setPreset] = useState<{ start: string; end: string } | null>(null);

  const { calendar, weekendAt, termAt } = useAdminCalendar(reservations);

  /**
   * Sesja wygasła w trakcie pracy.
   *
   * Panel bywa otwarty godzinami, a sesja żyje dobę — prędzej czy później ktoś
   * kliknie „Potwierdź” na martwej sesji. Jedyną sensowną reakcją jest wtedy
   * odesłanie do wejścia, a NIE ponawianie żądania: pętla powtórek zasypałaby
   * ekran tostami, nie zbliżając nikogo do zalogowania.
   */
  const handleExpiredSession = useCallback(() => {
    markUnauthenticated();
    router.replace(ENTRY_PATH);
  }, [markUnauthenticated, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReservations(await getAdminReservations({ includeArchived }));
    } catch (caught) {
      if (isApiError(caught) && caught.status === 401) {
        handleExpiredSession();
        return;
      }
      setError(userMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [includeArchived, handleExpiredSession]);

  /**
   * DANE POBIERAMY DOPIERO PO POTWIERDZENIU SESJI.
   *
   * Nie „na wszelki wypadek, backend i tak odmówi”. Żądanie wysłane przed
   * sprawdzeniem kończyłoby się 401 przy każdym wejściu niezalogowanego,
   * a przy sesji ważnej dawałoby migotanie pustego panelu przed danymi.
   */
  useEffect(() => {
    if (authenticated) void load();
  }, [authenticated, load]);

  useEffect(() => {
    if (!authLoading && !authenticated) router.replace(ENTRY_PATH);
  }, [authLoading, authenticated, router]);

  // Jedno pobranie zasila i listę, i kalendarz — patrz useAdminCalendar.
  const refreshAll = useCallback(() => {
    void load();
  }, [load]);

  /** Błąd z akcji w panelu: 401 odsyła do wejścia, reszta idzie jako toast. */
  const reportError = useCallback(
    (message: string, caught?: unknown) => {
      if (isApiError(caught) && caught.status === 401) {
        handleExpiredSession();
        return;
      }
      push("error", message);
    },
    [push, handleExpiredSession],
  );

  async function handleLogout() {
    await logout();
    // Gasimy też preferencję ?zoja — inaczej wejście na stronę główną od razu
    // pokazywałoby formularz logowania, czego nikt po wylogowaniu nie oczekuje.
    exitAdmin();
    router.replace("/");
  }

  /**
   * Klik w kalendarzu: zajęty termin otwiera edytor, wolny podstawia daty
   * do formularza.
   *
   * Kalendarz podaje identyfikator TERMINU, a lista trzyma identyfikatory
   * REZERWACJI — dlatego dopasowujemy po obu. Przy mockach pole slotId nie
   * istnieje i zostaje samo porównanie po id.
   */
  function openByReservationId(id: string | undefined, start: string, end: string) {
    const found = id
      ? (reservations.find((r) => r.id === id) ?? reservations.find((r) => r.slotId === id))
      : undefined;
    if (found) {
      setEditing(found);
      return;
    }
    setPreset({ start, end });
    push("info", "Daty wpisane w formularz poniżej.");
  }

  const revision = `${month}-${loading}-${includeArchived}-${editing?.id ?? ""}-${reservations.length}-${toasts.length}-${preset?.start ?? ""}`;

  if (authLoading) {
    return (
      <PageShell revision="sprawdzanie-sesji">
        <LoadingState label="Sprawdzanie dostępu…" />
      </PageShell>
    );
  }

  /**
   * Bez sesji NIE renderujemy nawet szkieletu panelu — przekierowanie jest już
   * w drodze. Pokazanie choćby pustych ram sugerowałoby, że dostęp jest, tylko
   * dane się nie wczytały.
   */
  if (!authenticated) {
    return (
      <PageShell revision="brak-sesji">
        <LoadingState label="Przenosimy do trybu gospodarzy…" />
      </PageShell>
    );
  }

  return (
    <PageShell revision={revision}>
      <header className="flex flex-col gap-3 px-0.5">
        <p className="m-0 text-[11px] uppercase tracking-[.16em] text-muted">Tryb gospodarzy</p>
        <h1 className="m-0 font-serif text-[26px] font-medium leading-[1.12] tracking-[-0.01em] [text-wrap:pretty] sm:text-[38px]">
          Panel terminów
        </h1>
        <p className="m-0 max-w-[56ch] text-[14px] leading-relaxed text-ink2 [text-wrap:pretty]">
          Dostępu pilnuje hasło gospodarzy, a sesja wygasa po dobie. O każdej
          pojedynczej operacji i tak decyduje backend.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/" className="min-h-[44px] text-[13.5px] font-semibold text-accentHover underline underline-offset-[3px]">
            ← Widok gościa
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="min-h-[44px] text-[13.5px] font-semibold text-muted underline underline-offset-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Wyloguj
          </button>
        </div>
      </header>

      {!loading && !error && (
        <MonthGrid
          month={month}
          setMonth={setMonth}
          minMonth={calendar.rangeStart.slice(0, 7)}
          maxMonth={calendar.rangeEnd.slice(0, 7)}
          admin
          picked={null}
          weekendAt={weekendAt}
          termAt={termAt}
          onOpenWeekend={(saturday) => {
            const weekend = weekendAt(saturday, addDays(saturday, 1));
            openByReservationId(weekend.reservationId, saturday, addDays(saturday, 1));
          }}
          onOpenTerm={(term: CalendarTerm) =>
            openByReservationId(term.reservationId, term.dateStart, term.dateEnd)
          }
        />
      )}

      <AdminCreateForm
        key={preset ? `${preset.start}-${preset.end}` : "default"}
        initialStart={preset?.start}
        initialEnd={preset?.end}
        onCreated={(message) => {
          push("success", message);
          refreshAll();
        }}
        onError={(message) => reportError(message)}
      />

      {loading && <LoadingState label="Ładowanie terminów…" />}

      {!loading && error && <ErrorState title="Nie udało się wczytać listy" message={error} onRetry={load} />}

      {!loading && !error && (
        <AdminReservationList
          reservations={reservations}
          includeArchived={includeArchived}
          onToggleArchived={setIncludeArchived}
          onOpen={setEditing}
        />
      )}

      <DevPanel onReset={refreshAll} />

      {editing && (
        <ReservationEditor
          reservation={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            push("success", message);
            refreshAll();
          }}
          onError={(message) => reportError(message)}
        />
      )}

      <Toasts toasts={toasts} onClose={dismiss} />
    </PageShell>
  );
}
