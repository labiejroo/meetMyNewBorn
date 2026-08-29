"use client";

interface Props {
  range: string;
  onConfirm: () => void;
  onReject: () => void;
}

/** Pasek po wysłaniu prośby: czekamy na potwierdzenie gospodarzy (symulacja maila). */
export function PendingBar({ range, onConfirm, onReject }: Props) {
  return (
    <div className="flex animate-zoia-in flex-wrap items-center gap-x-4 gap-y-2.5 rounded-2xl border border-[rgba(217,164,65,.55)] bg-[rgba(217,164,65,.16)] px-[18px] py-[15px]">
      <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[10px] border border-[rgba(217,164,65,.6)] bg-[rgba(217,164,65,.3)] text-[10px] tracking-[-.5px] text-mustardInk">•••</span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <strong className="text-[14px] font-semibold text-[#6B4A0E] [text-wrap:pretty]">
          Prośba wysłana — gospodarze muszą jeszcze potwierdzić ten termin. Napiszemy Ci maila.
        </strong>
        <span className="text-[12.5px] text-mustardInk">{range}</span>
      </div>
      <div className="flex w-full flex-wrap items-center gap-3.5 border-t border-dashed border-[rgba(122,84,16,.3)] pt-2.5">
        <span className="text-[11px] uppercase tracking-[.08em] text-[#9A7A3A]">symulacja maila do gospodarzy</span>
        <span role="button" tabIndex={0} onClick={onConfirm} className="cursor-pointer text-[13px] font-semibold text-mustardInk underline underline-offset-[3px]">potwierdzam termin</span>
        <span role="button" tabIndex={0} onClick={onReject} className="cursor-pointer text-[13px] text-[#9A7A3A] underline underline-offset-[3px]">odrzucam</span>
      </div>
    </div>
  );
}
