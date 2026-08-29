"use client";

import { STATUS, arrivalLabel, rgba } from "@/lib/status";
import { addDays, formatRange } from "@/lib/dates";
import type { Booking, ResultState } from "@/lib/types";

const COPY = {
  confirmed: { status: "free" as const, icon: "✓", title: "Rezerwacja potwierdzona", text: "Gospodarze potwierdzili termin — gość dostał maila z potwierdzeniem. Do zobaczenia!" },
  expired: { status: "taken" as const, icon: "✕", title: "Prośba odrzucona", text: "Gospodarze nie potwierdzili tego terminu — weekend wrócił do puli. Można wybrać inny." },
  cancelled: { status: "blocked" as const, icon: "–", title: "Rezerwacja odwołana", text: "Termin jest znowu wolny dla innych gości." },
};

interface Props {
  result: ResultState;
  record?: Booking;
  onBack: () => void;
  onCancel: () => void;
}

export function ResultScreen({ result, record, onBack, onCancel }: Props) {
  const v = COPY[result.kind];
  const s = STATUS[v.status];

  return (
    <section className="flex flex-col items-center gap-[18px] rounded-3xl border border-line bg-card px-5 pb-10 pt-12 text-center">
      <span
        className="flex h-[58px] w-[58px] items-center justify-center rounded-[18px] text-[22px]"
        style={{ background: rgba(s.color, 0.24), border: `1px solid ${rgba(s.color, 0.5)}`, color: s.ink }}
      >
        {v.icon}
      </span>
      <h1 className="m-0 max-w-[22ch] font-serif text-[23px] font-medium leading-tight sm:text-[32px] [text-wrap:pretty]">{v.title}</h1>
      <p className="m-0 max-w-[44ch] text-[15px] leading-relaxed text-[#6E6259] [text-wrap:pretty]">{v.text}</p>

      {result.kind === "confirmed" && result.sat && (
        <div className="flex min-w-[min(100%,300px)] flex-col gap-1.5 rounded-2xl border border-line bg-cream px-5 py-4">
          <strong className="text-[14.5px] font-semibold">{formatRange(result.sat, addDays(result.sat, 1))}</strong>
          <span className="break-words text-[13px] text-[#6E6259]">{record?.guest}</span>
          <span className="text-[12.5px] text-muted">{arrivalLabel(record?.arrival)}</span>
        </div>
      )}

      <div className="mt-1 flex flex-col items-center gap-3">
        <span role="button" tabIndex={0} onClick={onBack} className="flex min-h-[48px] cursor-pointer items-center rounded-[14px] bg-accent px-[26px] text-[15px] font-semibold text-card hover:bg-accentHover">
          Wróć do listy terminów
        </span>
        {result.kind === "confirmed" && (
          <span role="button" tabIndex={0} onClick={onCancel} className="flex min-h-[44px] cursor-pointer items-center text-[13.5px] text-accentHover underline underline-offset-[3px]">
            odwołaj rezerwację
          </span>
        )}
      </div>
    </section>
  );
}
