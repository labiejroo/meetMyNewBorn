import { STATUS, rgba } from "@/lib/status";
import type { Status } from "@/lib/types";

const ITEMS: { status: Status; label: string; dashed?: boolean }[] = [
  { status: "free", label: "Wolne" },
  { status: "pending", label: "Prośba — czeka na nas" },
  { status: "taken", label: "Zajęte" },
  { status: "blocked", label: "Zablokowane" },
  { status: "holiday", label: "Święto / przerwa", dashed: true },
];

export function Legend() {
  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-2 rounded-2xl border border-line bg-card px-4 py-3.5">
      {ITEMS.map((it) => {
        const s = STATUS[it.status];
        return (
          <div key={it.status} className="flex items-center gap-[7px] text-[12.5px] text-ink2">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-md ${it.dashed ? "border border-dashed" : "border border-solid"}`}
              style={{
                background: rgba(s.color, it.dashed ? 0.18 : 0.3),
                borderColor: it.dashed ? "rgba(143,129,119,.85)" : rgba(s.color, 0.55),
                color: s.ink,
                fontSize: s.icon === "•••" ? 9 : 11,
                letterSpacing: s.icon === "•••" ? "-.5px" : undefined,
              }}
            >
              {s.icon}
            </span>
            {it.label}
          </div>
        );
      })}
      <div className="flex items-center gap-[7px] text-[12.5px] text-ink2">
        <span className="flex h-5 w-5 items-center justify-center rounded-md text-[12px] text-faint">14</span>
        Dzień roboczy — niedostępny
      </div>
    </div>
  );
}
