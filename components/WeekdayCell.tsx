import { STATUS, rgba } from "@/lib/status";
import { TODAY, dayNum, formatRange, monthOf } from "@/lib/dates";
import type { Term } from "@/lib/types";

interface Props {
  day: string;
  monthNum: number;
  term: Term | null;
  admin: boolean;
  onOpenTerm: (term: Term) => void;
}

/** Dzień roboczy: cichy numer na tle strony — chyba że gospodarze utworzyli tam termin. */
export function WeekdayCell({ day, monthNum, term, admin, onOpenTerm }: Props) {
  const inMonth = monthOf(day) === monthNum;

  if (!term) {
    return (
      <div className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 sm:min-h-[74px]">
        <span
          className="text-[12.5px] tabular-nums sm:text-[14px]"
          style={{ color: day < TODAY ? "#D2C8BC" : "#BCB0A4", opacity: inMonth ? 1 : 0.5 }}
        >
          {dayNum(day)}
        </span>
      </div>
    );
  }

  const s = STATUS[term.status];
  const first = day === term.start;
  const last = day === term.end;
  const edge = `1.5px dashed ${rgba(s.color, 0.8)}`;

  return (
    <div
      title={`${formatRange(term.start, term.end)} — termin dodany przez gospodarzy · ${term.guest ?? ""}`}
      onClick={admin ? () => onOpenTerm(term) : undefined}
      className={`flex min-h-[56px] flex-col items-center justify-center gap-px sm:min-h-[74px] sm:gap-[3px] ${admin ? "cursor-pointer" : ""}`}
      style={{
        background: rgba(s.color, 0.24),
        borderTop: edge,
        borderBottom: edge,
        borderLeft: first ? edge : "none",
        borderRight: last ? edge : "none",
        borderRadius: `${first ? 11 : 0}px ${last ? 11 : 0}px ${last ? 11 : 0}px ${first ? 11 : 0}px`,
      }}
    >
      <span className="text-[13px] font-semibold leading-none tabular-nums sm:text-[15px]" style={{ color: s.ink, opacity: inMonth ? 1 : 0.7 }}>
        {dayNum(day)}
      </span>
      <span className="text-[10.5px] leading-none sm:text-[12px]" style={{ color: s.ink }}>{s.icon}</span>
    </div>
  );
}
