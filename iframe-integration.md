# Osadzenie „Odwiedzin u Zoi” w stronie rodzinnej

Apka nie ma własnego scrolla. Sama mierzy swoją treść i mówi stronie
nadrzędnej, jak wysoki ma być `<iframe>`. Strona rodzica odpowiada informacją,
którą część iframe użytkownik faktycznie widzi — dzięki temu modal rezerwacji
otwiera się w polu widzenia, a nie w geometrycznym środku bardzo wysokiej ramki.

Działająca implementacja tego kodu leży w `../react-parent`.

## Kontrakt wiadomości

### iframe → rodzic

```json
{ "type": "ZOJA_IFRAME_RESIZE", "height": 742 }
```

Wysyłane po każdej zmianie wysokości treści: zmiana miesiąca, otwarcie i
zamknięcie modala, toast, zmiana widoku, wczytanie fontów.

### rodzic → iframe (opcjonalne, ale zalecane)

```json
{ "type": "ZOJA_PARENT_VIEWPORT", "offsetTop": 320, "viewportHeight": 780 }
```

* `offsetTop` — ile pikseli iframe zostało przewinięte ponad górną krawędź okna.
* `viewportHeight` — wysokość widocznego wycinka iframe.

Bez tej wiadomości apka nadal działa; modal wraca wtedy do zwykłego
`position: fixed`.

## Kod strony rodzica

```html
<iframe
  id="zoja"
  src="https://zoja.example.netlify.app"
  title="Rezerwacja odwiedzin u Zoi"
  style="width: 100%; border: 0; height: 640px; display: block"
  referrerpolicy="strict-origin-when-cross-origin"
></iframe>

<script>
  // Origin apki. Musi być dokładny — bez wildcardów, bez ukośnika na końcu.
  const ZOJA_ORIGIN = "https://zoja.example.netlify.app";
  const frame = document.getElementById("zoja");

  // Zapas doklejany do wysokości ramki na każdej rozdzielczości — apka podaje
  // wysokość treści co do piksela, a my dajemy jej trochę luzu na dole.
  const HEIGHT_PADDING = 100;

  // 1. Odbiór wysokości.
  window.addEventListener("message", (event) => {
    // Sprawdzamy nadawcę ZANIM spojrzymy na treść.
    if (event.origin !== ZOJA_ORIGIN) return;
    // I czy to naprawdę nasza ramka, a nie inny iframe na stronie.
    if (event.source !== frame.contentWindow) return;

    const data = event.data;
    if (!data || data.type !== "ZOJA_IFRAME_RESIZE") return;
    if (typeof data.height !== "number" || !Number.isFinite(data.height)) return;

    // Zapas + klamra na wypadek błędu po drugiej stronie.
    const raw = Math.round(data.height) + HEIGHT_PADDING;
    const height = Math.min(Math.max(raw, 200), 20000);
    frame.style.height = height + "px";

    sendViewport(); // apka żyje — odeślij jej widoczny wycinek
  });

  // 2. Odesłanie widocznego wycinka, żeby modal trafiał w ekran.
  function sendViewport() {
    const win = frame.contentWindow;
    if (!win) return;
    const rect = frame.getBoundingClientRect();
    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, window.innerHeight);
    win.postMessage(
      {
        type: "ZOJA_PARENT_VIEWPORT",
        offsetTop: Math.max(0, -rect.top),
        viewportHeight: Math.max(0, visibleBottom - visibleTop),
      },
      ZOJA_ORIGIN, // konkretny origin, nigdy "*"
    );
  }

  let queued = false;
  function scheduleViewport() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      sendViewport();
    });
  }

  window.addEventListener("scroll", scheduleViewport, { passive: true });
  window.addEventListener("resize", scheduleViewport);
  frame.addEventListener("load", sendViewport);
</script>
```

## O czym pamiętać

* **Zawsze sprawdzaj `event.origin`.** Bez tego dowolna strona otwarta w innej
  karcie może podać się za apkę i sterować wysokością ramki.
* **Nie używaj `"*"` jako `targetOrigin`.** Apka wysyła wyłącznie na
  `NEXT_PUBLIC_PARENT_ORIGIN` i tylko stamtąd przyjmuje wiadomości.
* **Nie dawaj iframe własnego scrolla.** Wysokość ustawia rodzic; wewnętrzny
  pasek przewijania psuje pozycjonowanie modala.
* **Origin musi się zgadzać po obu stronach.** `NEXT_PUBLIC_PARENT_ORIGIN` w
  apce = origin strony rodzica; `ZOJA_ORIGIN` u rodzica = origin apki. Ta sama
  wartość steruje nagłówkiem `Content-Security-Policy: frame-ancestors`.
* **Produkcyjnie warto dodać `sandbox`** na iframe, np.
  `sandbox="allow-scripts allow-same-origin allow-forms"`.
