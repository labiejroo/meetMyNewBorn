/**
 * Kontrakt wiadomości między apką w iframe a stroną rodzinną.
 * Jedno źródło prawdy — ten sam kształt implementuje strona rodzica
 * (patrz iframe-integration.md).
 */

/**
 * Origin rodzica sprowadzony do postaci, jaką faktycznie ma `event.origin`.
 *
 * DLACZEGO TO NIE JEST ZWYKŁY ODCZYT ZMIENNEJ
 * Przeglądarka w `event.origin` NIGDY nie podaje końcowego ukośnika, a w
 * zmiennej środowiskowej łatwo go zostawić — wystarczy wkleić adres z paska
 * przeglądarki. Ścisłe porównanie stringów odrzucało wtedy po cichu każdą
 * wiadomość od rodzica: brak błędu, brak ostrzeżenia, tylko modal ustawiony
 * w środku bardzo wysokiej ramki, czyli poza tym, co widzi użytkownik.
 *
 * URL() normalizuje też wielkość liter i domyślny port, więc porównanie
 * przestaje zależeć od tego, jak ktoś wpisał adres.
 */
export function normalizeOrigin(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  try {
    return new URL(trimmed).origin;
  } catch {
    // Nie URL — obcinamy przynajmniej końcowe ukośniki.
    return trimmed.replace(new RegExp("/+$"), "");
  }
}

/** Jedno źródło prawdy dla obu stron rozmowy z rodzicem. */
export const PARENT_ORIGIN = normalizeOrigin(process.env.NEXT_PUBLIC_PARENT_ORIGIN);

export const ZOJA_IFRAME_RESIZE = "ZOJA_IFRAME_RESIZE";
export const ZOJA_PARENT_VIEWPORT = "ZOJA_PARENT_VIEWPORT";
export const ZOJA_SCROLL_TO_EMBED = "ZOJA_SCROLL_TO_EMBED";

/** iframe → rodzic: treść ma teraz tyle pikseli wysokości. */
export interface ZojaResizeMessage {
  type: typeof ZOJA_IFRAME_RESIZE;
  height: number;
}

/**
 * rodzic → iframe: który fragment iframe jest w tej chwili widoczny w oknie.
 * Dzięki temu modal potrafi ustawić się w polu widzenia zamiast w geometrycznym
 * środku bardzo wysokiego iframe.
 */
export interface ZojaParentViewportMessage {
  type: typeof ZOJA_PARENT_VIEWPORT;
  /** Ile px iframe zostało przewinięte ponad górną krawędź okna rodzica (>= 0). */
  offsetTop: number;
  /** Wysokość widocznego wycinka iframe w px. */
  viewportHeight: number;
}

/**
 * iframe → rodzic: przewiń stronę tak, żeby sekcja z rezerwacją znalazła się
 * przy górnej krawędzi okna.
 *
 * Kotwicę wskazuje RODZIC, nie my — to jego strona i jego układ. Ramka mówi
 * tylko „teraz jest dobry moment”, bo nie może przewinąć dokumentu zza granicy
 * originu. Wiadomość jest celowo bez parametrów: gdyby ramka podawała piksele,
 * wiedziałaby o cudzym layoucie więcej, niż powinna.
 */
export interface ZojaScrollToEmbedMessage {
  type: typeof ZOJA_SCROLL_TO_EMBED;
}

export type ZojaChildMessage = ZojaResizeMessage | ZojaScrollToEmbedMessage;
export type ZojaParentMessage = ZojaParentViewportMessage;

export function isParentViewportMessage(data: unknown): data is ZojaParentViewportMessage {
  if (typeof data !== "object" || data === null) return false;
  const m = data as Record<string, unknown>;
  return (
    m.type === ZOJA_PARENT_VIEWPORT &&
    typeof m.offsetTop === "number" &&
    Number.isFinite(m.offsetTop) &&
    typeof m.viewportHeight === "number" &&
    Number.isFinite(m.viewportHeight)
  );
}
