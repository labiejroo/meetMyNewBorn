import { STATUS, rgba } from "@/lib/status";
import type { Status } from "@/lib/types";

export function StatusChip({ status }: { status: Status }) {
  const s = STATUS[status];
  return (
    <span
      className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[11px]"
      style={{
        background: rgba(s.color, status === "holiday" ? 0.14 : 0.26),
        border: status === "holiday" ? `1px dashed ${rgba("#8F8177", 0.7)}` : `1px solid ${rgba(s.color, 0.5)}`,
        color: s.ink,
        fontSize: s.icon === "•••" ? 10 : 14,
        letterSpacing: s.icon === "•••" ? "-.5px" : undefined,
      }}
    >
      {s.icon}
    </span>
  );
}
