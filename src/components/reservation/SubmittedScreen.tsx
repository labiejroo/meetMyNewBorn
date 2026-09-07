"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { ResultPanel } from "@/components/ui/States";
import { formatRange } from "@/lib/dates";
import { usingMocks } from "@/services/http";
import type { CreateReservationResult } from "@/types";

interface Props {
  result: CreateReservationResult;
  onBack: () => void;
}

/**
 * Ekran po wysłaniu zgłoszenia.
 *
 * Świadomie NIE mówimy „zarezerwowano”. Rezerwacja ma status `pending`
 * i dopiero rodzice ją potwierdzają — obiecanie tu czegokolwiek więcej
 * byłoby wprowadzaniem w błąd.
 */
export function SubmittedScreen({ result, onBack }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <ResultPanel tone="warning" eyebrow="Zgłoszenie wysłane" title="Dziękujemy, mamy Wasze zgłoszenie">
        <p className="m-0 max-w-[52ch] text-[15.5px] font-semibold leading-relaxed text-mustardInk [text-wrap:pretty]">
          Twoja prośba o wizytę została wysłana i czeka na potwierdzenie przez rodziców Zoi.
        </p>
        <p className="m-0 max-w-[52ch] text-[14.5px] leading-relaxed text-ink2 [text-wrap:pretty]">
          Termin <strong>{formatRange(result.dateStart, result.dateEnd)}</strong> jest na razie
          zarezerwowany wstępnie, nikt inny go nie zajmie. Gdy rezerwacja zostanie potwierdzona
          albo odrzucona, otrzymasz wiadomość e-mail.
        </p>
        <Button variant="secondary" onClick={onBack}>
          Wróć do kalendarza
        </Button>
      </ResultPanel>

      {usingMocks && (result.decisionUrlForDemo || result.cancelUrlForDemo) && (
        <aside className="flex flex-col gap-2.5 rounded-2xl border border-dashed border-line2 bg-cream px-4 py-4">
          <strong className="text-[12.5px] uppercase tracking-[.12em] text-muted">
            Podgląd deweloperski
          </strong>
          <p className="m-0 text-[13px] leading-relaxed text-ink2 [text-wrap:pretty]">
            Docelowo te linki wychodzą mailem i nigdy nie trafiają na ten ekran. Tutaj są po to,
            żeby dało się przejść cały przepływ lokalnie.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {result.decisionUrlForDemo && (
              <Link
                href={result.decisionUrlForDemo}
                className="text-[13.5px] font-semibold text-accentHover underline underline-offset-[3px]"
              >
                Link dla rodziców →
              </Link>
            )}
            {result.cancelUrlForDemo && (
              <Link
                href={result.cancelUrlForDemo}
                className="text-[13.5px] font-semibold text-accentHover underline underline-offset-[3px]"
              >
                Link do odwołania →
              </Link>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
