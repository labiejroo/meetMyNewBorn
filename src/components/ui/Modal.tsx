"use client";

import { useCallback, useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";

import { useParentViewport } from "@/hooks/useParentViewport";

interface Props {
  title: string;
  /** Krótka linia nad tytułem — kontekst, nie zdanie. */
  eyebrow?: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** Przyciski akcji; przyklejone pod treścią. */
  footer?: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Ustawienie panelu wewnątrz overlaya.
 *
 * UWAGA NA OŚ: kontener jest flex-em w WIERSZU, więc pionem steruje `items-*`,
 * a `justify-*` odpowiada za poziom. Zamiana tych dwóch przesunęłaby panel
 * w bok zamiast do góry.
 *
 * Telefon — `items-end`: arkusz wysuwany od dołu, bliżej kciuka.
 *
 * Desktop — `items-start` zamiast centrowania. Wyśrodkowany panel oddawał
 * połowę wolnej wysokości na pustkę nad sobą, więc formularz urywał się
 * wyżej, niż musiał. Zakotwiczony u góry oddaje tę przestrzeń treści.
 *
 * `sm:p-6` to 24 px odstępu od krawędzi widocznego wycinka, `lg:pt-8` podbija
 * to do 32 px na wysokich ekranach. Panel celowo nie dotyka samej góry — ma
 * nadal czytać się jak okno, nie jak pasek przyklejony do krawędzi.
 *
 * `sm:overflow-y-auto` przenosi przewijanie z wnętrza panelu na overlay.
 * Dzięki temu panel zachowuje naturalną, stałą wysokość zamiast kurczyć się
 * do wielkości okna, a użytkownik przewija całe okno modala tak jak stronę.
 * Overlay jest kotwiczony do widocznego wycinka ramki, więc przewijanie musi
 * odbywać się TUTAJ — dokument iframe nie urośnie pod panel poza flow.
 */
const OVERLAY_CLASS =
  "fixed inset-0 z-[60] flex items-end justify-center overscroll-contain bg-[rgba(61,51,44,.42)] sm:items-start sm:overflow-y-auto sm:p-6 lg:pt-8";

/**
 * Na telefonie arkusz wysuwany od dołu, na desktopie okno zakotwiczone przy
 * górnej krawędzi widocznego obszaru — patrz OVERLAY_CLASS.
 * Zamknięcie Escape, pułapka na focus i powrót focusa tam, skąd przyszedł.
 */
export function Modal({ title, eyebrow, subtitle, onClose, children, footer }: Props) {
  const viewport = useParentViewport();
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialogRef.current)?.focus();

    return () => restoreFocusTo.current?.focus?.();
  }, []);

  /**
   * Tło nie rusza się, dopóki modal jest otwarty.
   *
   * Same klasy `overscroll-contain` nie wystarczają: zatrzymują łańcuch dopiero
   * na krawędzi przewijalnego elementu, a gdy modal mieści się bez suwaka, nie
   * mają czego zatrzymywać — gest trafia od razu w dokument.
   *
   * `overflow: hidden` na body blokuje przewijanie samej apki. `overscroll-behavior`
   * na elemencie głównym jest tu ważniejszy: to on nie pozwala ramce przekazać
   * gestu STRONIE RODZICA. Jej samej nie zablokujemy — jest za granicą originu.
   *
   * Poprzednie wartości zapamiętujemy i przywracamy, zamiast czyścić na sztywno,
   * żeby nie skasować stylu ustawionego przez kogoś innego.
   */
  useEffect(() => {
    const { body } = document;
    const root = document.documentElement;
    const previousOverflow = body.style.overflow;
    const previousOverscroll = root.style.overscrollBehavior;

    body.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";

    return () => {
      body.style.overflow = previousOverflow;
      root.style.overscrollBehavior = previousOverscroll;
    };
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  /**
   * W iframe 100vh to wysokość CAŁEJ ramki, nie tego, co widzi użytkownik.
   * Gdy strona rodzica przyśle widoczny wycinek, kotwiczymy modal w nim —
   * inaczej na długim kalendarzu wylądowałby poza ekranem.
   */
  const visibleHeight = viewport ? Math.max(viewport.viewportHeight, 320) : 0;
  const overlayStyle: CSSProperties | undefined = viewport
    ? { position: "absolute", top: viewport.offsetTop, bottom: "auto", height: visibleHeight }
    : undefined;
  /**
   * Limit wysokości podajemy ZMIENNĄ CSS, a nie wprost jako `maxHeight`.
   *
   * Styl inline bije każdą klasę, więc twarde `maxHeight` uniemożliwiłoby
   * zdjęcie limitu na desktopie (`sm:max-h-none`). Przez zmienną limit działa
   * tam, gdzie ma działać — na telefonie, gdzie arkusz musi zmieścić się
   * w widocznym wycinku — a desktop może go po prostu wyłączyć.
   */
  const sheetStyle = (
    viewport ? { "--zoja-sheet-max": `${Math.round(visibleHeight * 0.94)}px` } : undefined
  ) as CSSProperties | undefined;

  return (
    <div
      className={OVERLAY_CLASS}
      style={overlayStyle}
      onClick={onClose}
      onKeyDown={onKeyDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        style={sheetStyle}
        className="flex max-h-[var(--zoja-sheet-max,94vh)] w-full max-w-[470px] animate-zoia-sheet flex-col overflow-hidden rounded-t-[24px] border border-line bg-card shadow-[0_12px_40px_rgba(61,51,44,.18)] outline-none sm:max-h-none sm:rounded-[24px]"
      >
        <div className="flex items-start justify-between gap-3.5 px-5 pt-[22px]">
          <div className="flex min-w-0 flex-col gap-[5px]">
            {eyebrow && (
              <span className="text-[11px] uppercase tracking-[.14em] text-muted">{eyebrow}</span>
            )}
            <h2
              id={titleId}
              className="m-0 font-serif text-[20px] font-medium leading-tight tracking-[-0.01em] [text-wrap:pretty] sm:text-[25px]"
            >
              {title}
            </h2>
            {subtitle && <span className="text-[12.5px] font-semibold text-muted">{subtitle}</span>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij okno"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-[13px] bg-cream2 text-[15px] text-muted transition-colors hover:bg-line focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            ✕
          </button>
        </div>

        {/*
          Telefon: arkusz jest przycięty do widocznego wycinka, więc to wnętrze
          się przewija, a nagłówek i stopka zostają przyklejone.

          Desktop: żadnego wewnętrznego scrolla. Panel ma naturalną wysokość —
          stałą, niezależną od tego, ile akurat widać — a gdy nie mieści się
          na ekranie, przewija się CAŁY overlay. Dzięki temu formularz nie
          kurczy się do paska z własnym suwakiem.
        */}
        <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto overscroll-contain px-5 py-[18px] sm:overflow-visible">
          {children}
        </div>

        {footer && (
          <div className="flex flex-col gap-2.5 border-t border-line bg-cream px-5 pb-[22px] pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
