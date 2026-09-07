import { RESERVATION_STATUS, WEEKEND_STATE, rgba, type StatusMeta } from "@/lib/status";
import type { ReservationStatus, WeekendState } from "@/types";

interface Props {
  state?: WeekendState;
  status?: ReservationStatus;
}

/** Kwadratowa ikonka statusu — używana na listach terminów. */
export function StatusChip({ state, status }: Props) {
  const meta: StatusMeta = status ? RESERVATION_STATUS[status] : WEEKEND_STATE[state ?? "free"];
  const muted = state === "holiday";

  return (
    <span
      aria-hidden
      className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[11px]"
      style={{
        background: rgba(meta.color, muted ? 0.14 : 0.26),
        border: muted ? `1px dashed ${rgba("#8F8177", 0.7)}` : `1px solid ${rgba(meta.color, 0.5)}`,
        color: meta.ink,
        fontSize: meta.icon === "•••" ? 10 : 14,
        letterSpacing: meta.icon === "•••" ? "-.5px" : undefined,
      }}
    >
      {meta.icon}
    </span>
  );
}
