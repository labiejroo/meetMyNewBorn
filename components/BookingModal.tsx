"use client";

import { cap, dd, dowName, formatRange } from "@/lib/dates";
import type { Arrival, FormState, ModalTarget, Status } from "@/lib/types";

interface Props {
  target: ModalTarget;
  form: FormState;
  errors: { email?: string; guest?: string };
  admin: boolean;
  sending: boolean;
  deleteArmed: boolean;
  canBlock: boolean;
  onField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onClose: () => void;
  onSubmit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onBlock: () => void;
}

export function BookingModal(p: Props) {
  const { target: t, form, errors, admin } = p;
  const field = (err?: string) =>
    `min-h-[48px] rounded-[13px] border bg-cream px-3.5 text-[15px] text-ink ${err ? "border-terra" : "border-line"}`;

  const options: { key: Arrival; label: string }[] = [
    { key: "sat", label: `${cap(dowName(t.start))} ${dd(t.start)}` },
    { key: "sun", label: `${cap(dowName(t.end))} ${dd(t.end)}` },
    { key: null, label: "Jeszcze nie wiemy" },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgba(61,51,44,.42)] sm:items-center sm:p-6"
      onClick={p.onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-[470px] animate-zoia-sheet flex-col gap-[18px] overflow-y-auto rounded-t-[24px] border border-line bg-card px-5 pb-[26px] pt-[22px] shadow-[0_12px_40px_rgba(61,51,44,.18)] sm:max-h-[92vh] sm:rounded-[24px]"
      >
        <div className="flex items-start justify-between gap-3.5">
          <div className="flex min-w-0 flex-col gap-[5px]">
            <span className="text-[11px] uppercase tracking-[.14em] text-muted">
              {admin
                ? "Tryb gospodarzy"
                : t.weekend
                  ? "Rezerwacja weekendu"
                  : "Termin poza weekendem"}
            </span>
            <h2 className="m-0 font-serif text-[20px] font-medium leading-tight tracking-[-0.01em] sm:text-[25px] [text-wrap:pretty]">
              {formatRange(t.start, t.end)}
            </h2>
            <span className="text-[12.5px] font-semibold text-muted">
              {admin
                ? "Wszystkie pola edytowalne"
                : t.weekend
                  ? "Weekend wolny — rezerwujecie oba dni"
                  : "Termin dodany przez gospodarzy"}
            </span>
          </div>
          <span
            role="button"
            tabIndex={0}
            onClick={p.onClose}
            className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center rounded-[13px] bg-cream2 text-[15px] text-muted"
          >
            ✕
          </span>
        </div>

        {!admin && (
          <div className="flex flex-col gap-2 rounded-[15px] border border-[rgba(217,164,65,.55)] bg-[rgba(217,164,65,.16)] px-[17px] py-[15px]">
            <strong className="text-[14.5px] font-semibold leading-snug text-[#6B4A0E] [text-wrap:pretty]">
              To jeszcze nie koniec — termin musimy potwierdzić my, rodzice.
              Dostaniesz maila, gdy to zrobimy.
            </strong>
            <span className="text-[12.5px] leading-snug text-mustardInk">
              Najpierw wyślemy Ci maila, że prośba dotarła. Sprawdź, czy adres
              jest poprawny.
            </span>
          </div>
        )}

        <label className="flex flex-col gap-[7px] text-[13px] font-medium text-ink2">
          E-mail
          <input
            type="email"
            value={form.email}
            onChange={(e) => p.onField("email", e.target.value)}
            placeholder="babcia.krysia@example.com"
            className={field(errors.email)}
          />
          {errors.email && (
            <span className="text-[12.5px] font-semibold text-terraInk">
              {errors.email}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-[7px] text-[13px] font-medium text-ink2">
          Kto przyjedzie?
          <input
            type="text"
            maxLength={80}
            value={form.guest}
            onChange={(e) => p.onField("guest", e.target.value.slice(0, 80))}
            placeholder="np. Babcia Krysia z dziadkiem Jankiem"
            className={field(errors.guest)}
          />
          <div className="flex justify-between gap-3">
            {errors.guest && (
              <span className="text-[12.5px] font-semibold text-terraInk">
                {errors.guest}
              </span>
            )}
            <span
              className={`ml-auto text-[12px] tabular-nums ${form.guest.length >= 80 ? "text-terraInk" : "text-muted2"}`}
            >
              {form.guest.length}/80
            </span>
          </div>
        </label>

        <div className="flex flex-col gap-[9px]">
          <span className="text-[13px] font-medium text-ink2">
            Kiedy przyjeżdżacie?
          </span>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {options.map((o) => {
              const on = form.arrival === o.key;
              return (
                <div
                  key={String(o.key)}
                  onClick={() => p.onField("arrival", o.key)}
                  className={`flex min-h-[54px] flex-1 cursor-pointer items-center gap-2.5 rounded-[13px] border-[1.5px] px-3.5 transition-colors sm:basis-[130px] ${
                    on
                      ? "border-accent bg-[rgba(201,139,132,.16)]"
                      : "border-line bg-cream"
                  }`}
                >
                  <span
                    className="h-[18px] w-[18px] flex-none rounded-full border-[1.5px]"
                    style={{
                      borderColor: on ? "#B57169" : "#CFC2B3",
                      background: on ? "#B57169" : "#FFFDFA",
                      boxShadow: on ? "inset 0 0 0 3px #FFFDFA" : undefined,
                    }}
                  />
                  <span
                    className={`text-[14.5px] ${on ? "font-semibold text-terraInk" : "font-medium text-ink2"}`}
                  >
                    {o.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="m-0 text-[12.5px] font-semibold leading-relaxed text-[#8A6B66] [text-wrap:pretty]">
            Rezerwujecie cały weekend — pytamy tylko po to, żeby wiedzieć, kiedy
            się Was spodziewać.
          </p>
        </div>

        {admin && (
          <label className="flex flex-col gap-[7px] text-[13px] font-medium text-ink2">
            Status terminu
            <select
              value={form.status}
              onChange={(e) => p.onField("status", e.target.value as Status)}
              className="min-h-[48px] rounded-[13px] border border-line bg-cream px-3 text-[15px] text-ink"
            >
              <option value="free">Wolne</option>
              <option value="pending">Prośba — do potwierdzenia</option>
              <option value="taken">Zajęte</option>
              <option value="blocked">Zablokowane przez gospodarzy</option>
            </select>
          </label>
        )}

        <div
          role="button"
          tabIndex={0}
          onClick={() => p.onField("visible", !form.visible)}
          className="flex cursor-pointer items-start gap-2.5 rounded-[15px] border border-line bg-cream px-3.5 py-3.5"
        >
          <span
            className="flex h-6 w-6 flex-none items-center justify-center rounded-lg border-[1.5px] text-[13px] text-card"
            style={{
              background: form.visible ? "#7C9A73" : "#FFFDFA",
              borderColor: form.visible ? "#5F7D57" : "#CFC2B3",
            }}
          >
            {form.visible ? "✓" : ""}
          </span>
          <div className="flex min-w-0 flex-col gap-[3px]">
            <strong className="text-[14px] font-semibold leading-snug [text-wrap:pretty]">
              Pokaż innym, kto przyjeżdża
            </strong>
            <span className="break-words text-[12.5px] leading-snug text-muted [text-wrap:pretty]">
              {form.visible
                ? `Inni goście zobaczą „${form.guest.trim() || "kto przyjeżdża"}” przy tym weekendzie.`
                : "Po odznaczeniu inni zobaczą tylko „Zajęte”."}
            </span>
          </div>
        </div>

        {!admin && (
          <span
            role="button"
            tabIndex={0}
            onClick={p.onSubmit}
            className={`flex min-h-[54px] items-center justify-center rounded-[15px] text-[16px] font-semibold text-card ${p.sending ? "cursor-progress bg-[#D8B0AB]" : "cursor-pointer bg-accent hover:bg-accentHover"}`}
          >
            {p.sending ? "Rezerwuję…" : "Rezerwuję"}
          </span>
        )}

        {admin && (
          <div className="flex flex-col gap-2.5">
            {p.canBlock && (
              <span
                role="button"
                tabIndex={0}
                onClick={p.onBlock}
                className="flex min-h-[48px] cursor-pointer items-center justify-center rounded-[14px] border border-line2 bg-cream text-[15px] font-semibold text-ink2 hover:bg-cream2"
              >
                Zablokuj termin
              </span>
            )}
            <div className="flex flex-wrap gap-2.5">
              <span
                role="button"
                tabIndex={0}
                onClick={p.onDelete}
                className={`flex min-h-[52px] flex-1 basis-[130px] cursor-pointer items-center justify-center rounded-[14px] border-[1.5px] text-[15px] font-semibold ${
                  p.deleteArmed
                    ? "border-terra bg-terra text-card"
                    : "border-[rgba(196,104,92,.55)] bg-[rgba(196,104,92,.12)] text-terraInk"
                }`}
              >
                {p.deleteArmed ? "Potwierdź usunięcie" : "Usuń"}
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={p.onSave}
                className="flex min-h-[52px] flex-1 basis-[130px] cursor-pointer items-center justify-center rounded-[14px] border-[1.5px] border-terra bg-terra text-[15px] font-semibold text-card"
              >
                Zmień
              </span>
            </div>
            {p.deleteArmed && (
              <span className="text-center text-[12.5px] font-semibold text-terraInk">
                Kliknij „Usuń” jeszcze raz, żeby potwierdzić.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
