import { WEEKEND_STATE, rgba } from "@/lib/status";
import type { WeekendState } from "@/types";

const ITEMS: { state: WeekendState; label: string; dashed?: boolean }[] = [
  { state: "free", label: "Wolne" },
  { state: "pending", label: "Czeka na potwierdzenie" },
  { state: "booked", label: "Zajęte" },
  { state: "blocked", label: "Zablokowane" },
  { state: "holiday", label: "Święto / przerwa", dashed: true },
];

export function Legend() {
  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-2 rounded-2xl border border-line bg-card px-4 py-3.5">
      {ITEMS.map((item) => {
        const meta = WEEKEND_STATE[item.state];
        return (
          <div key={item.state} className="flex items-center gap-[7px] text-[12.5px] text-ink2">
            <span
              aria-hidden
              className={`flex h-5 w-5 items-center justify-center rounded-md ${item.dashed ? "border border-dashed" : "border border-solid"}`}
              style={{
                background: rgba(meta.color, item.dashed ? 0.18 : 0.3),
                borderColor: item.dashed ? "rgba(143,129,119,.85)" : rgba(meta.color, 0.55),
                color: meta.ink,
                fontSize: meta.icon === "•••" ? 9 : 11,
                letterSpacing: meta.icon === "•••" ? "-.5px" : undefined,
              }}
            >
              {meta.icon}
            </span>
            {item.label}
          </div>
        );
      })}
      <div className="flex items-center gap-[7px] text-[12.5px] text-ink2">
        <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-md text-[12px] text-faint">
          14
        </span>
        Dzień roboczy: niedostępny
      </div>
    </div>
  );
}
