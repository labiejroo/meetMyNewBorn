"use client";

import { useCallback, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { requestScrollToEmbed } from "@/hooks/useIframeResize";
import { cap, dd, dowName, formatRange } from "@/lib/dates";
import { createReservation } from "@/services/reservationService";
import { isApiError, userMessage } from "@/types";
import type { ApiErrorCode, ArrivalDay, CreateReservationResult } from "@/types";

import { TurnstileField } from "./TurnstileField";

interface Props {
  saturday: string;
  sunday: string;
  initialArrival: ArrivalDay;
  onClose: () => void;
  onCreated: (result: CreateReservationResult) => void;
  /**
   * Błędy niezwiązane z konkretnym polem lecą wyżej, na toast. Kod pozwala
   * stronie zareagować inaczej na konflikt terminu niż na awarię sieci.
   */
  onError: (message: string, code?: ApiErrorCode) => void;
}

const FIELD =
  "min-h-[52px] rounded-[13px] border bg-cream px-3.5 text-[15.5px] text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";

export function BookingModal({ saturday, sunday, initialArrival, onClose, onCreated, onError }: Props) {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [arrival, setArrival] = useState<ArrivalDay>(initialArrival);
  const [notes, setNotes] = useState("");
  // Domyślnie odznaczony: brak działania gościa = zgoda na pokazanie, kto
  // przyjedzie. Zaznaczenie ukrywa tę informację przed innymi.
  const [isPrivate, setIsPrivate] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  /**
   * Licznik wymuszający świeże wyzwanie Turnstile.
   *
   * Token Cloudflare jest JEDNORAZOWY. Modal zostaje otwarty po nieudanej
   * próbie — zajęty termin, odmowa weryfikacji, awaria — więc bez podbicia
   * tej wartości druga próba poleciałaby ze zużytym już tokenem i odbiła się
   * jako duplikat, czyli komunikatem zupełnie nie o tym, co się stało.
   */
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const nameId = useId();
  const emailId = useId();
  const notesId = useId();
  const arrivalLabelId = useId();

  const handleToken = useCallback((token: string | null) => setTurnstileToken(token), []);

  /**
   * Na desktopie prosimy stronę rodzica, żeby przewinęła się do sekcji
   * z rezerwacją — dzięki temu formularz otwiera się przy górnej krawędzi okna,
   * a nie gdzieś w połowie długiej strony. Funkcja sama pilnuje, żeby nic nie
   * wysłać na telefonie ani poza ramką.
   */
  useEffect(() => {
    requestScrollToEmbed();
  }, []);

  async function submit() {
    if (sending) return; // podwójne kliknięcie nie wyśle drugiego zgłoszenia
    setSending(true);
    setErrors({});

    try {
      const result = await createReservation({
        dateStart: saturday,
        dateEnd: sunday,
        guestName,
        guestEmail,
        arrivalDay: arrival,
        notes,
        isPrivate,
        // undefined, nie null: pole jest opcjonalne w kontrakcie backendu.
        turnstileToken: turnstileToken ?? undefined,
      });
      onCreated(result);
    } catch (caught) {
      if (isApiError(caught) && caught.fields) setErrors(caught.fields);
      else onError(userMessage(caught), isApiError(caught) ? caught.code : undefined);

      // Próba dotarła do backendu, więc token trzeba uznać za zużyty —
      // niezależnie od tego, czy odbiła się o captchę, czy o zajęty termin.
      setTurnstileToken(null);
      setTurnstileResetKey((key) => key + 1);

      setSending(false);
    }
  }

  const options: { key: ArrivalDay; label: string }[] = [
    { key: "saturday", label: `${cap(dowName(saturday))} ${dd(saturday)}` },
    { key: "sunday", label: `${cap(dowName(sunday))} ${dd(sunday)}` },
    { key: null, label: "Jeszcze nie wiem" },
  ];

  return (
    <Modal
      eyebrow="Rezerwacja weekendu"
      title={formatRange(saturday, sunday)}
      subtitle="Weekend wolny, rezerwujecie oba dni"
      onClose={onClose}
      footer={
        <Button fullWidth onClick={submit} loading={sending} loadingLabel="Wysyłanie zgłoszenia…">
          Rezerwuję
        </Button>
      }
    >
      <div className="flex flex-col gap-2 rounded-[15px] border border-[rgba(217,164,65,.55)] bg-[rgba(217,164,65,.16)] px-[17px] py-[15px]">
        <strong className="text-[14.5px] font-semibold leading-snug text-[#6B4A0E] [text-wrap:pretty]">
          To jeszcze nie koniec. Termin musimy potwierdzić my, rodzice. Dostaniesz maila, gdy to zrobimy.
        </strong>
        <span className="text-[12.5px] leading-snug text-mustardInk">
          Najpierw wyślemy Ci maila, że prośba dotarła. Sprawdź, czy adres jest poprawny.
        </span>
      </div>

      <div className="flex flex-col gap-[7px]">
        <label htmlFor={nameId} className="text-[13.5px] font-medium text-ink2">
          Kto przyjedzie?
        </label>
        <input
          id={nameId}
          type="text"
          maxLength={80}
          value={guestName}
          onChange={(event) => setGuestName(event.target.value.slice(0, 80))}
          placeholder="np. Babcia Krysia z dziadkiem Jankiem"
          aria-invalid={Boolean(errors.guestName)}
          aria-describedby={errors.guestName ? `${nameId}-error` : undefined}
          className={`${FIELD} ${errors.guestName ? "border-terra" : "border-line"}`}
        />
        {errors.guestName && (
          <span id={`${nameId}-error`} className="text-[12.5px] font-semibold text-terraInk">
            {errors.guestName}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-[7px]">
        <label htmlFor={emailId} className="text-[13.5px] font-medium text-ink2">
          E-mail
        </label>
        <input
          id={emailId}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={guestEmail}
          onChange={(event) => setGuestEmail(event.target.value)}
          placeholder="babcia.krysia@example.com"
          aria-invalid={Boolean(errors.guestEmail)}
          aria-describedby={errors.guestEmail ? `${emailId}-error` : undefined}
          className={`${FIELD} ${errors.guestEmail ? "border-terra" : "border-line"}`}
        />
        {errors.guestEmail && (
          <span id={`${emailId}-error`} className="text-[12.5px] font-semibold text-terraInk">
            {errors.guestEmail}
          </span>
        )}
      </div>

      <fieldset className="m-0 flex flex-col gap-[9px] border-0 p-0">
        <legend id={arrivalLabelId} className="p-0 text-[13.5px] font-medium text-ink2">
          Kiedy przyjeżdżacie?
        </legend>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {options.map((option) => {
            const active = arrival === option.key;
            return (
              <button
                key={String(option.key)}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setArrival(option.key)}
                className={`flex min-h-[54px] flex-1 cursor-pointer items-center gap-2.5 rounded-[13px] border-[1.5px] px-3.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:basis-[130px] ${
                  active ? "border-accent bg-[rgba(201,139,132,.16)]" : "border-line bg-cream"
                }`}
              >
                <span
                  aria-hidden
                  className="h-[18px] w-[18px] flex-none rounded-full border-[1.5px]"
                  style={{
                    borderColor: active ? "#B57169" : "#CFC2B3",
                    background: active ? "#B57169" : "#FFFDFA",
                    boxShadow: active ? "inset 0 0 0 3px #FFFDFA" : undefined,
                  }}
                />
                <span className={`text-[14.5px] ${active ? "font-semibold text-terraInk" : "font-medium text-ink2"}`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
        <p className="m-0 text-[12.5px] font-semibold leading-relaxed text-[#8A6B66] [text-wrap:pretty]">
          Rezerwujecie cały weekend, pytamy tylko po to, żeby wiedzieć, kiedy się Was spodziewać.
        </p>
      </fieldset>

      <div className="flex flex-col gap-[7px]">
        <label htmlFor={notesId} className="text-[13.5px] font-medium text-ink2">
          Chcecie coś dodać? <span className="font-normal text-muted">(nieobowiązkowe)</span>
        </label>
        <textarea
          id={notesId}
          rows={3}
          maxLength={400}
          value={notes}
          onChange={(event) => setNotes(event.target.value.slice(0, 400))}
          placeholder="np. przyjedziemy z małym psem, wracamy w niedzielę po obiedzie"
          className={`${FIELD} min-h-[92px] resize-y border-line py-3 leading-relaxed`}
        />
      </div>

      <TurnstileField onToken={handleToken} resetKey={turnstileResetKey} />

      <div className="flex flex-col gap-[7px]">
        <button
          type="button"
          role="checkbox"
          aria-checked={isPrivate}
          onClick={() => setIsPrivate((value) => !value)}
          className="flex cursor-pointer items-start gap-2.5 rounded-[15px] border border-line bg-cream px-3.5 py-3.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span
            aria-hidden
            className="flex h-6 w-6 flex-none items-center justify-center rounded-lg border-[1.5px] text-[13px] text-card"
            style={{
              background: isPrivate ? "#7C9A73" : "#FFFDFA",
              borderColor: isPrivate ? "#5F7D57" : "#CFC2B3",
            }}
          >
            {isPrivate ? "✓" : ""}
          </span>
          <span className="flex min-w-0 flex-col gap-[3px]">
            <strong className="text-[14px] font-semibold leading-snug [text-wrap:pretty]">
              Nie pokazuj publicznie, kto przyjedzie
            </strong>
            <span className="text-[12.5px] leading-snug text-muted [text-wrap:pretty]">
              Dla innych osób termin będzie widoczny po prostu jako zajęty.
            </span>
          </span>
        </button>
      </div>
    </Modal>
  );
}
