"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatRange } from "@/lib/dates";
import { deleteReservation, updateReservation } from "@/services/adminService";
import { adminApiIsLive } from "@/services/http";
import { userMessage } from "@/types";
import type { AdminReservation, ArrivalDay, ReservationStatus } from "@/types";

interface Props {
  reservation: AdminReservation;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

const FIELD =
  "min-h-[50px] rounded-[13px] border border-line bg-cream px-3.5 text-[15px] text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";

const STATUSES: { value: ReservationStatus; label: string }[] = [
  { value: "pending", label: "Czeka na decyzję" },
  { value: "booked", label: "Potwierdzona" },
  { value: "rejected", label: "Odrzucona" },
  { value: "cancelled", label: "Odwołana" },
  { value: "blocked", label: "Zablokowany termin" },
  { value: "expired", label: "Wygasła" },
];

const ARRIVALS: { value: string; label: string }[] = [
  { value: "saturday", label: "Sobota" },
  { value: "sunday", label: "Niedziela" },
  { value: "", label: "Jeszcze nie wiadomo" },
];

/**
 * Statusy, które da się ustawić przy prawdziwym backendzie.
 *
 * "blocked" jest cechą TERMINU, nie rezerwacji, a "expired" backend wylicza
 * z dat i nigdzie go nie przechowuje. Do "pending" nie ma powrotu — decyzji
 * nie cofa się jednym kliknięciem. Pokazywanie tych opcji obiecywałoby
 * operację, którą API i tak odrzuci.
 */
const LIVE_STATUSES = STATUSES.filter((option) =>
  ["pending", "booked", "rejected", "cancelled"].includes(option.value),
);

export function ReservationEditor({ reservation, onClose, onSaved, onError }: Props) {
  // Wiersz zablokowanego TERMINU, nie rezerwacji. Danych gościa tam nie ma.
  const isSlotRow = reservation.id.startsWith("slot:");
  const statusOptions = adminApiIsLive ? LIVE_STATUSES : STATUSES;
  const [status, setStatus] = useState<ReservationStatus>(reservation.status);
  const [dateStart, setDateStart] = useState(reservation.dateStart);
  const [dateEnd, setDateEnd] = useState(reservation.dateEnd);
  const [guestName, setGuestName] = useState(reservation.guestName);
  const [guestEmail, setGuestEmail] = useState(reservation.guestEmail);
  const [arrivalDay, setArrivalDay] = useState<ArrivalDay>(reservation.arrivalDay);
  const [notes, setNotes] = useState(reservation.notes ?? "");
  const [adminNote, setAdminNote] = useState(reservation.adminNote ?? "");
  const [guestVisible, setGuestVisible] = useState(reservation.guestVisible);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  /** Usuwanie zawsze wymaga drugiego kliknięcia. */
  const [deleteArmed, setDeleteArmed] = useState(false);

  const ids = {
    status: useId(), start: useId(), end: useId(), name: useId(),
    email: useId(), arrival: useId(), notes: useId(), adminNote: useId(),
  };

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      await updateReservation(reservation.id, {
        // Status leci tylko wtedy, gdy naprawdę się zmienił — każde przejście
        // to osobne wywołanie po stronie serwisu, a niepotrzebne wołanie
        // confirm/reject/cancel byłoby myleniem historii.
        ...(status !== reservation.status ? { status } : {}),
        dateStart, dateEnd, guestName, guestEmail, arrivalDay,
        notes: notes.trim() ? notes.trim() : null,
        // Notatki wewnętrznej backend nie ma; przy blokadzie służy za jej powód.
        ...(adminApiIsLive && !isSlotRow
          ? {}
          : { adminNote: adminNote.trim() ? adminNote.trim() : null }),
        guestVisible,
      });
      onSaved("Zmiany zapisane.");
      onClose();
    } catch (caught) {
      onError(userMessage(caught));
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteReservation(reservation.id);
      onSaved("Termin usunięty, weekend wrócił do puli.");
      onClose();
    } catch (caught) {
      onError(userMessage(caught));
      setDeleting(false);
    }
  }

  return (
    <Modal
      eyebrow="Tryb gospodarzy"
      title={formatRange(reservation.dateStart, reservation.dateEnd)}
      subtitle="Wszystkie pola edytowalne"
      onClose={onClose}
      footer={
        <>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button
              variant="danger"
              fullWidth
              onClick={remove}
              loading={deleting}
              loadingLabel="Usuwanie…"
              disabled={saving}
            >
              {deleteArmed ? "Potwierdź usunięcie" : "Usuń"}
            </Button>
            <Button fullWidth onClick={save} loading={saving} loadingLabel="Zapisywanie…" disabled={deleting}>
              Zapisz zmiany
            </Button>
          </div>
          {deleteArmed && !deleting && (
            <span className="text-center text-[12.5px] font-semibold text-terraInk">
              Kliknij „Potwierdź usunięcie”, żeby usunąć na dobre.
            </span>
          )}
        </>
      }
    >
      {reservation.bounce && (
        <div className="flex flex-col gap-1.5 rounded-[15px] border border-[rgba(196,104,92,.5)] bg-[rgba(196,104,92,.10)] px-4 py-3.5">
          <strong className="text-[13.5px] font-semibold text-terraInk">
            Mail wrócił ({reservation.bounce.type === "hard" ? "twardy odrzut" : reservation.bounce.type === "soft" ? "chwilowy problem" : "skarga"})
          </strong>
          <span className="text-[12.5px] leading-snug text-ink2 [text-wrap:pretty]">
            {reservation.bounce.reason}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-[7px]">
        <label htmlFor={ids.status} className="text-[13.5px] font-medium text-ink2">Status</label>
        <select
          id={ids.status}
          value={status}
          onChange={(event) => setStatus(event.target.value as ReservationStatus)}
          className={FIELD}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
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
      <p className="m-0 -mt-2 text-[12.5px] leading-snug text-muted [text-wrap:pretty]">
        Gospodarze mogą ustawić dowolny zakres, także dni robocze, Wigilię i przerwę świąteczną.
      </p>

      <div className="flex flex-col gap-[7px]">
        <label htmlFor={ids.name} className="text-[13.5px] font-medium text-ink2">Kto przyjeżdża</label>
        <input id={ids.name} type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} className={FIELD} />
      </div>

      <div className="flex flex-col gap-[7px]">
        <label htmlFor={ids.email} className="text-[13.5px] font-medium text-ink2">E-mail</label>
        <input id={ids.email} type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className={FIELD} />
      </div>

      <div className="flex flex-col gap-[7px]">
        <label htmlFor={ids.arrival} className="text-[13.5px] font-medium text-ink2">Dzień przyjazdu</label>
        <select
          id={ids.arrival}
          value={arrivalDay ?? ""}
          onChange={(event) => setArrivalDay((event.target.value || null) as ArrivalDay)}
          className={FIELD}
        >
          {ARRIVALS.map((option) => (
            <option key={option.label} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-[7px]">
        <label htmlFor={ids.notes} className="text-[13.5px] font-medium text-ink2">Notatka od gościa</label>
        <textarea id={ids.notes} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${FIELD} min-h-[76px] resize-y py-3 leading-relaxed`} />
      </div>

      <div className="flex flex-col gap-[7px]">
        <label htmlFor={ids.adminNote} className="text-[13.5px] font-medium text-ink2">
          Notatka wewnętrzna <span className="font-normal text-muted">(gość jej nie widzi)</span>
        </label>
        <textarea id={ids.adminNote} rows={2} value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className={`${FIELD} min-h-[76px] resize-y py-3 leading-relaxed`} />
      </div>

      <button
        type="button"
        role="checkbox"
        aria-checked={guestVisible}
        onClick={() => setGuestVisible((value) => !value)}
        className="flex cursor-pointer items-start gap-2.5 rounded-[15px] border border-line bg-cream px-3.5 py-3.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span
          aria-hidden
          className="flex h-6 w-6 flex-none items-center justify-center rounded-lg border-[1.5px] text-[13px] text-card"
          style={{ background: guestVisible ? "#7C9A73" : "#FFFDFA", borderColor: guestVisible ? "#5F7D57" : "#CFC2B3" }}
        >
          {guestVisible ? "✓" : ""}
        </span>
        <span className="flex min-w-0 flex-col gap-[3px]">
          <strong className="text-[14px] font-semibold leading-snug">Pokaż innym, kto przyjeżdża</strong>
          <span className="text-[12.5px] leading-snug text-muted [text-wrap:pretty]">
            {guestVisible ? "Inni goście zobaczą nazwisko przy tym weekendzie." : "Inni zobaczą tylko „Zajęte”."}
          </span>
        </span>
      </button>
    </Modal>
  );
}
