"use client";

import { useState } from "react";
import type { Status } from "@/lib/types";

interface Props {
  onAdd: (start: string, end: string, guest: string, status: Status) => void;
}

/** Termin dowolnego zakresu dat — na święta i długie weekendy. */
export function AdminForm({ onAdd }: Props) {
  const [start, setStart] = useState("2026-11-11");
  const [end, setEnd] = useState("2026-11-11");
  const [guest, setGuest] = useState("");
  const [status, setStatus] = useState<Status>("taken");
  const [error, setError] = useState<string | null>(null);

  const inputClass = "min-h-[46px] rounded-xl border border-line bg-cream px-3 text-[14.5px] text-ink";

  function submit() {
    if (!start || !end || end < start) { setError("Data „do” nie może być wcześniejsza niż „od”."); return; }
    if (!guest.trim()) { setError("Napisz, kto przyjedzie."); return; }
    setError(null);
    onAdd(start, end, guest, status);
    setGuest("");
  }

  return (
    <section className="flex flex-col gap-3.5 rounded-[22px] border border-line bg-card px-4 py-5">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 font-serif text-[19px] font-medium tracking-[-0.01em]">Dodaj termin poza weekendem</h2>
        <p className="m-0 text-[12.5px] leading-relaxed text-muted [text-wrap:pretty]">
          Dla świąt i długich weekendów. Gość takiego terminu nie wybierze sam — ale gdy istnieje, jego kratki stają się aktywne, także w przerwie świątecznej.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-1 basis-[150px] flex-col gap-1.5 text-[12px] tracking-[.02em] text-muted">
          Od
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-1 basis-[150px] flex-col gap-1.5 text-[12px] tracking-[.02em] text-muted">
          Do
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-[2] basis-[220px] flex-col gap-1.5 text-[12px] tracking-[.02em] text-muted">
          Kto przyjedzie
          <input type="text" value={guest} onChange={(e) => setGuest(e.target.value.slice(0, 80))} placeholder="np. Chrzestna Hania z Jankiem" className={inputClass} />
        </label>
        <label className="flex flex-1 basis-[150px] flex-col gap-1.5 text-[12px] tracking-[.02em] text-muted">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className={inputClass}>
            <option value="taken">Zajęte</option>
            <option value="pending">Prośba</option>
            <option value="blocked">Zablokowane</option>
          </select>
        </label>
      </div>
      {error && <span className="text-[12.5px] font-semibold text-terraInk">{error}</span>}
      <span role="button" tabIndex={0} onClick={submit} className="flex min-h-[46px] cursor-pointer items-center self-start rounded-[13px] bg-accent px-[22px] text-[14.5px] font-semibold text-card hover:bg-accentHover">
        Dodaj termin
      </span>
    </section>
  );
}
