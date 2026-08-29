"use client";

import { useBooking } from "@/lib/useBooking";
import { addDays, formatRange } from "@/lib/dates";
import { arrivalLabel } from "@/lib/status";
import { Legend } from "@/components/Legend";
import { MonthGrid } from "@/components/MonthGrid";
import { PendingBar } from "@/components/PendingBar";
import { TermList } from "@/components/TermList";
import { BookingModal } from "@/components/BookingModal";
import { AdminForm } from "@/components/AdminForm";
import { AdminList } from "@/components/AdminList";
import { ResultScreen } from "@/components/ResultScreen";
import { Toasts } from "@/components/Toasts";

export default function Page() {
  const b = useBooking();

  const pillClass = (on: boolean) =>
    `flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-[12.5px] font-semibold ${
      on ? "border-[rgba(201,139,132,.6)] bg-[rgba(201,139,132,.16)] text-terraInk" : "border-line text-muted"
    }`;

  return (
    <main className="flex min-h-screen flex-col items-center px-4 pb-[72px] pt-7">
      <div className="flex w-full max-w-[880px] flex-col gap-5">
        {b.result ? (
          <ResultScreen
            result={b.result}
            record={b.result.sat ? b.bookings[b.result.sat] : undefined}
            onBack={() => b.setResult(null)}
            onCancel={b.cancelConfirmed}
          />
        ) : (
          <>
            <header className="flex flex-col gap-3 px-0.5">
              <p className="m-0 text-[11px] uppercase tracking-[.16em] text-muted">{b.admin ? "Tryb gospodarzy" : "Rezerwacja odwiedzin"}</p>
              <h1 className="m-0 font-serif text-[26px] font-medium leading-[1.12] tracking-[-0.01em] sm:text-[40px] [text-wrap:pretty]">
                Apka do rezerwacji pierwszych odwiedzin naszej córki Zoi
              </h1>
              <p className="m-0 max-w-[52ch] text-[15px] leading-relaxed text-[#6E6259] [text-wrap:pretty]">
                Wybierzcie termin, który Wam pasuje — damy znać mailem, kiedy będzie potwierdzony.
              </p>
              <p className="m-0 mt-0.5 text-[13.5px] font-semibold leading-relaxed tracking-[.01em] text-accentHover">
                Rezerwujemy całe weekendy — sobota i niedziela zawsze razem. Dni roboczych nie da się wybrać.
              </p>
            </header>

            {b.pending && (
              <PendingBar
                range={formatRange(b.pending.sat, addDays(b.pending.sat, 1))}
                onConfirm={b.confirmPending}
                onReject={b.rejectPending}
              />
            )}

            <Legend />

            <MonthGrid
              month={b.month}
              setMonth={b.setMonth}
              admin={b.admin}
              pick={b.pick}
              weekendInfo={b.weekendInfo}
              termAt={b.termAt}
              onOpenWeekend={b.openWeekend}
              onOpenTerm={b.openTerm}
            />

            {b.pick && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-2xl border border-[rgba(201,139,132,.45)] bg-[rgba(201,139,132,.10)] px-[18px] py-3.5">
                <div className="flex flex-col gap-[3px]">
                  <strong className="text-[14px] font-semibold">{formatRange(b.pick.sat, addDays(b.pick.sat, 1))}</strong>
                  <span className="text-[12.5px] text-[#8A6B66]">{arrivalLabel(b.pick.arrival)} — rezerwujecie oba dni</span>
                </div>
                <span role="button" tabIndex={0} onClick={() => b.openWeekend(b.pick!.sat, b.pick!.arrival)} className="ml-auto cursor-pointer text-[13px] font-semibold text-accentHover">
                  otwórz formularz
                </span>
              </div>
            )}

            <TermList rows={b.allTerms} admin={b.admin} onOpenWeekend={b.openWeekend} onOpenTerm={b.openTerm} />

            {b.admin && (
              <>
                <AdminForm onAdd={b.addTerm} />
                <AdminList bookings={b.bookings} terms={b.terms} onOpenWeekend={b.openWeekend} onOpenTerm={b.openTerm} />
              </>
            )}

            <div className="mt-3.5 flex flex-wrap items-center gap-x-[18px] gap-y-2.5 border-t border-line pt-4">
              <span role="button" tabIndex={0} onClick={() => b.setAdmin(!b.admin)} className={pillClass(b.admin)}>
                {b.admin ? "Tryb gospodarzy: włączony" : "Tryb gospodarzy"}
              </span>
              <span role="button" tabIndex={0} onClick={() => b.setFailMode(!b.failMode)} className={pillClass(b.failMode)}>
                {b.failMode ? "Błąd API: włączony" : "Symuluj błąd API"}
              </span>
              <span className="text-[11.5px] tracking-[.02em] text-faint">w docelowej apce: ?zoja</span>
              <div className="ml-auto flex gap-3">
                <span role="button" tabIndex={0} onClick={() => b.setResult({ kind: "confirmed", sat: "2026-09-05" })} className="cursor-pointer text-[11.5px] text-muted2 underline underline-offset-[3px]">potwierdzono</span>
                <span role="button" tabIndex={0} onClick={() => b.setResult({ kind: "expired" })} className="cursor-pointer text-[11.5px] text-muted2 underline underline-offset-[3px]">odrzucono</span>
                <span role="button" tabIndex={0} onClick={() => b.setResult({ kind: "cancelled" })} className="cursor-pointer text-[11.5px] text-muted2 underline underline-offset-[3px]">odwołano</span>
              </div>
            </div>
          </>
        )}
      </div>

      {b.modal && b.form && (
        <BookingModal
          target={b.modal}
          form={b.form}
          errors={b.errors}
          admin={b.admin}
          sending={b.sending}
          deleteArmed={b.deleteArmed}
          canBlock={b.admin && b.modal.weekend && !!b.modal.sat && b.weekendInfo(b.modal.sat).status === "free"}
          onField={b.setField}
          onClose={b.closeModal}
          onSubmit={b.submit}
          onSave={b.saveAdmin}
          onDelete={b.deleteAdmin}
          onBlock={b.blockWeekend}
        />
      )}

      <Toasts toasts={b.toasts} onClose={b.dropToast} />
    </main>
  );
}
