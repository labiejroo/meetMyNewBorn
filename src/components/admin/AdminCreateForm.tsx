"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { addDays, nextSaturday, todayIso } from "@/lib/dates";
import { createAdminReservation, createBlockedDate } from "@/services/adminService";
import { userMessage } from "@/types";

interface Props {
  onCreated: (message: string) => void;
  onError: (message: string) => void;
  /** Zakres wstępnie wypełniony po kliknięciu w kalendarz. */
  initialStart?: string;
  initialEnd?: string;
}

type Mode = "reservation" | "block";

const FIELD =
  "min-h-[50px] rounded-[13px] border border-line bg-cream px-3.5 text-[15px] text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";

/** Zakładanie terminu ręcznie albo blokowanie zakresu dat. */
export function AdminCreateForm({ onCreated, onError, initialStart, initialEnd }: Props) {
  const firstSaturday = nextSaturday(todayIso());

  const [mode, setMode] = useState<Mode>("reservation");
  const [dateStart, setDateStart] = useState(initialStart ?? firstSaturday);
  const [dateEnd, setDateEnd] = useState(initialEnd ?? addDays(firstSaturday, 1));
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const ids = { start: useId(), end: useId(), name: useId(), email: useId(), reason: useId() };

  async function submit() {
    if (saving) return;
    setSaving(true);
    try {
      if (mode === "block") {
        await createBlockedDate({
          dateStart,
          dateEnd,
          reason: reason.trim() || "Termin niedostępny",
        });
        onCreated("Termin zablokowany.");
      } else {
        await createAdminReservation({
          dateStart,
          dateEnd,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          // Status ustala backend: wizyta wpisana przez rodzicow jest z
          // definicji potwierdzona. Pole zostaje w typie mockow, wiec podajemy
          // je dla zgodnosci, ale do API nie leci.
          status: "booked",
          arrivalDay: null,
          adminNote: reason.trim() || undefined,
        });
        onCreated("Termin dodany.");
      }
      setGuestName("");
      setGuestEmail("");
      setReason("");
    } catch (caught) {
      onError(userMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  const tab = (value: Mode, label: string) => (
    <button
      key={value}
      type="button"
      role="tab"
      aria-selected={mode === value}
      onClick={() => setMode(value)}
      className={`min-h-[44px] flex-1 rounded-xl border px-3.5 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        mode === value
          ? "border-[rgba(201,139,132,.6)] bg-[rgba(201,139,132,.16)] text-terraInk"
          : "border-line text-muted hover:bg-cream"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section className="flex flex-col gap-3.5 rounded-[22px] border border-line bg-card px-4 py-4">
      <h2 className="m-0 font-serif text-[21px] font-medium tracking-[-0.01em]">Dodaj termin</h2>

      <div role="tablist" aria-label="Rodzaj terminu" className="flex gap-2">
        {tab("reservation", "Własny termin")}
        {tab("block", "Zablokuj zakres")}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 flex-col gap-[7px]">
          <label htmlFor={ids.start} className="text-[13.5px] font-medium text-ink2">Od</label>
          <input id={ids.start} type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className={FIELD} />
        </div>
        <div className="flex flex-1 flex-col gap-[7px]">
          <label htmlFor={ids.end} className="text-[13.5px] font-medium text-ink2">Do</label>
          <input id={ids.end} type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className={FIELD} />
        </div>
      </div>

      {mode === "reservation" && (
        <>
          <div className="flex flex-col gap-[7px]">
            <label htmlFor={ids.name} className="text-[13.5px] font-medium text-ink2">Kto przyjeżdża</label>
            <input id={ids.name} type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="np. Chrzestna Hania z Jankiem" className={FIELD} />
          </div>
          <div className="flex flex-col gap-[7px]">
            <label htmlFor={ids.email} className="text-[13.5px] font-medium text-ink2">E-mail</label>
            <input id={ids.email} type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="hania@example.com" className={FIELD} />
          </div>
        </>
      )}

      <div className="flex flex-col gap-[7px]">
        <label htmlFor={ids.reason} className="text-[13.5px] font-medium text-ink2">
          {mode === "block" ? "Powód (zobaczą go goście)" : "Notatka wewnętrzna"}
        </label>
        <input
          id={ids.reason}
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={mode === "block" ? "np. wyjazd do lekarza" : "np. ustalone telefonicznie"}
          className={FIELD}
        />
      </div>

      <Button onClick={submit} loading={saving} loadingLabel="Zapisywanie…">
        {mode === "block" ? "Zablokuj termin" : "Dodaj termin"}
      </Button>
    </section>
  );
}
