import { formatLong, formatRange } from "@/lib/dates";
import { arrivalLabel } from "@/lib/status";
import type { ArrivalDay } from "@/types";

interface Props {
  dateStart: string;
  dateEnd: string;
  guestName: string;
  guestEmail?: string;
  arrivalDay: ArrivalDay;
  notes?: string | null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[3px] border-t border-line pt-3 first:border-0 first:pt-0">
      <dt className="text-[11.5px] uppercase tracking-[.12em] text-muted">{label}</dt>
      <dd className="m-0 break-words text-[15px] leading-snug text-ink [text-wrap:pretty]">{value}</dd>
    </div>
  );
}

/** Szczegóły zgłoszenia — ten sam układ na ekranie decyzji i odwołania. */
export function ReservationSummary({ dateStart, dateEnd, guestName, guestEmail, arrivalDay, notes }: Props) {
  return (
    <dl className="m-0 flex flex-col gap-3 rounded-2xl border border-line bg-card px-5 py-5">
      <Row label="Termin" value={formatRange(dateStart, dateEnd)} />
      <Row label="Dokładnie" value={`${formatLong(dateStart)} – ${formatLong(dateEnd)}`} />
      {guestName && <Row label="Kto przyjeżdża" value={guestName} />}
      {guestEmail && <Row label="Kontakt" value={guestEmail} />}
      <Row label="Przyjazd" value={arrivalLabel(arrivalDay)} />
      {notes && <Row label="Od gościa" value={notes} />}
    </dl>
  );
}
