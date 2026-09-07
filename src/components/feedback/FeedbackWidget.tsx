"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { submitFeedback } from "@/services/feedbackService";
import { isApiError, userMessage } from "@/types";

interface Props {
  onSent: (message: string) => void;
  onError: (message: string) => void;
}

const FIELD =
  "min-h-[52px] rounded-[13px] border border-line bg-cream px-3.5 text-[15.5px] text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";

/** „Masz uwagi?” — osobna ścieżka niż rezerwacje, własny serwis. */
export function FeedbackWidget({ onSent, onError }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const messageId = useId();
  const emailId = useId();

  async function send() {
    if (sending) return;
    setSending(true);
    setFieldError(null);
    try {
      await submitFeedback({ message, email: email || undefined });
      setOpen(false);
      setMessage("");
      setEmail("");
      onSent("Dziękujemy, przeczytamy każdą uwagę.");
    } catch (caught) {
      if (isApiError(caught) && caught.fields?.message) setFieldError(caught.fields.message);
      else onError(userMessage(caught));
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[44px] items-center gap-2 rounded-xl border border-line px-3.5 text-[12.5px] font-semibold text-muted transition-colors hover:bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Masz uwagi?
      </button>

      {open && (
        <Modal
          eyebrow="Uwagi"
          title="Coś tu nie działa albo przeszkadza?"
          subtitle="Piszcie śmiało, to bardzo pomaga"
          onClose={() => setOpen(false)}
          footer={
            <Button fullWidth onClick={send} loading={sending} loadingLabel="Wysyłanie…">
              Wyślij uwagę
            </Button>
          }
        >
          <div className="flex flex-col gap-[7px]">
            <label htmlFor={messageId} className="text-[13.5px] font-medium text-ink2">
              Wiadomość
            </label>
            <textarea
              id={messageId}
              rows={4}
              maxLength={800}
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 800))}
              placeholder="np. przyciski są dla mnie za małe, nie wiem, gdzie kliknąć"
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? `${messageId}-error` : undefined}
              className={`${FIELD} min-h-[110px] resize-y py-3 leading-relaxed ${fieldError ? "border-terra" : ""}`}
            />
            {fieldError && (
              <span id={`${messageId}-error`} className="text-[12.5px] font-semibold text-terraInk">
                {fieldError}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-[7px]">
            <label htmlFor={emailId} className="text-[13.5px] font-medium text-ink2">
              E-mail <span className="font-normal text-muted">(nieobowiązkowy)</span>
            </label>
            <input
              id={emailId}
              type="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="zostawcie, jeśli chcecie odpowiedź"
              className={FIELD}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
