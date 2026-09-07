# Odwiedziny u Zoi — frontend

Apka do umawiania pierwszych odwiedzin. Next.js (App Router) + TypeScript
w trybie `strict` + Tailwind. **Bez backendu** — wszystko odpowiada z warstwy
mocków, ale przez taki sam interfejs, jaki później dostanie API Gateway.

Osadzana w `<iframe>` na stronie rodzinnej. Makieta tej strony (czysty React
+ Vite) leży obok, w `../react-parent`.

## Wymagania

- Node 20 lub nowszy
- npm (projekt używa `package-lock.json`)

## Uruchomienie

```bash
npm install
npm run dev            # http://localhost:3000
```

Razem ze stroną rodzinną:

```bash
# terminal 1
npm run dev            # http://localhost:3000

# terminal 2
cd ../react-parent && npm install && npm run dev   # http://localhost:5173
```

Wejdź na **http://localhost:5173** — kalendarz jest osadzony w środku strony.

## Zmienne środowiskowe

Skopiuj `.env.example` do `.env.local`.

| Zmienna | Znaczenie |
| --- | --- |
| `NEXT_PUBLIC_PARENT_ORIGIN` | Origin strony rodzica. Jedyny cel `postMessage` i jedyne akceptowane źródło wiadomości. Ta sama wartość ląduje w `frame-ancestors`. |
| `NEXT_PUBLIC_API_BASE_URL` | Puste = mocki. Podanie adresu przełącza serwisy na prawdziwy backend. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Klucz Cloudflare Turnstile. Na razie nieużywany — widget jest placeholderem. |

## Struktura

```
src/
  app/
    page.tsx                 kalendarz gościa
    admin/page.tsx           panel gospodarzy
    decision/page.tsx        ekran decyzji rodziców (?t=<token>)
    cancel/page.tsx          ekran odwołania wizyty (?t=<token>)
  components/
    calendar/                siatka miesiąca, pigułka weekendu, legenda, lista
    reservation/             formularz, Turnstile, ekran po wysłaniu
    decision/                podsumowanie rezerwacji
    admin/                   lista, edytor, formularz terminów
    feedback/                „Masz uwagi?”
    ui/                      Modal, Button, Toasts, stany, PageShell
  services/                  jedyna droga do danych
  hooks/                     useCalendar, useAdminMode, useToasts, iframe
  lib/                       daty, statusy, kontrakt wiadomości iframe
  types/                     kontrakt domenowy
  mocks/                     mockowa baza i symulacja błędów
```

Zasada, która trzyma to w kupie: **komponenty nie znają mocków**. Importują
wyłącznie `@/services/*`. Kiedy pojawi się backend, `src/mocks/` znika,
a komponenty zostają nietknięte.

## Mock API

`src/services/http.ts` jest punktem wpięcia. Dopóki `NEXT_PUBLIC_API_BASE_URL`
jest puste, każdy serwis odpowiada z `src/mocks/db.ts`; po podaniu adresu
te same funkcje wołają `request()` na API Gateway.

| Serwis | Funkcje |
| --- | --- |
| `reservationService` | `getCalendar`, `createReservation`, `getReservationDecision`, `acceptReservation`, `rejectReservation`, `getCancellation`, `cancelReservation` |
| `adminService` | `getAdminReservations`, `updateReservation`, `createBlockedDate`, `createAdminReservation`, `deleteReservation` |
| `feedbackService` | `submitFeedback` |

Mockowy stan siedzi w `sessionStorage`, żeby dało się przejść cały przepływ:
zgłoszenie → link dla rodziców → decyzja → powrót na kalendarz. Panel
deweloperski pod kalendarzem pozwala zamówić błąd (409, 429, 500, 404, brak
sieci) i wyczyścić dane.

Gotowe tokeny do klikania bez zakładania rezerwacji:

- `/decision?t=demo-rodzice-oczekuje` — zgłoszenie czekające na decyzję
- `/decision?t=demo-rodzice-juz-po` — decyzja już podjęta
- `/cancel?t=demo-gosc-odwolanie` — wizyta do odwołania
- `/cancel?t=demo-gosc-juz-odwolane` — już odwołana

## Przepływ rezerwacji

1. Gość wybiera wolny weekend (sobota + niedziela zawsze razem) i wysyła formularz.
2. Rezerwacja dostaje status **`pending`**. Ekran mówi wprost, że wizyta czeka
   na potwierdzenie — nic tu nie sugeruje, że termin jest już przyklepany.
3. Rodzice dostają mailem link do `/decision?t=<token>`. **Samo wejście (GET)
   niczego nie zmienia** — pokazuje tylko szczegóły. Status zmienia dopiero
   kliknięcie „Akceptuję” / „Odrzucam”, czyli osobny POST.
4. Gość dostaje link do `/cancel?t=<token>` — tak samo: GET pokazuje, POST odwołuje.
5. Ponowne wejście w zużyty link pokazuje wynik zamiast przycisków.

## iframe

Apka mierzy własną treść i wysyła wysokość stronie nadrzędnej; ta odsyła
informację, którą część ramki widzi użytkownik, dzięki czemu modal otwiera się
w polu widzenia. Pełny kontrakt i gotowy kod dla rodzica:
[`iframe-integration.md`](./iframe-integration.md).

`postMessage` leci wyłącznie na `NEXT_PUBLIC_PARENT_ORIGIN` — bez wildcardu `"*"`.

## Tryb gospodarzy

Wejście na `/?zoja` ustawia flagę w `sessionStorage` i odsłania panel `/admin`:
kalendarz z pełnymi danymi, lista wszystkich terminów, przełącznik „Pokaż
archiwalne”, edytor (status, dowolny zakres dat, notatki, widoczność), dodawanie
własnych terminów i blokowanie zakresów, informacja o odbitym mailu. Usuwanie
zawsze wymaga drugiego kliknięcia.

**`?zoja` to tymczasowe rusztowanie, nie element docelowego projektu.** Istnieje
wyłącznie po to, żeby dało się obejrzeć panel, zanim powstanie backend. Nic nie
ma od niego zależeć — docelowo panel mieszka pod `/admin`, a dostęp daje token
z Lambdy `admin-auth`, weryfikowany przy każdym wywołaniu `/api/admin/*`.
Usunięcie `?zoja` i `sessionStorage` z `useAdminMode` jest częścią kroku
z logowaniem.

Do tego czasu obowiązuje prosta zasada: **na wgrany build nie wolno wpuścić
prawdziwych rezerwacji**. Każdy, kto dopisze `?zoja` do adresu, zobaczy panel
i wszystkie dane.

W iframe tryb gospodarzy jest wyłączony, a flaga kasowana.

## Build statyczny i deploy na S3

`npm run build` produkuje katalog `out/` — komplet plików do wgrania na S3.
Apka jest eksportem statycznym (`output: "export"`), więc nie ma serwera Next.js
ani niczego, co trzeba uruchamiać po stronie AWS.

Kształt wyniku (`trailingSlash` zostaje domyślne, żeby adresy w mailach były
czyste):

```
out/index.html      → /
out/admin.html      → /admin
out/decision.html   → /decision?t=<token>
out/cancel.html     → /cancel?t=<token>
out/404.html
out/_next/static/…  → zasoby z hashem w nazwie
```

**Zanim zbudujesz paczkę produkcyjną**, ustaw `NEXT_PUBLIC_PARENT_ORIGIN` na
prawdziwy adres strony nadrzędnej. Ta zmienna jest wkompilowywana w bundle —
z lokalnym `http://localhost:5173` ramka na produkcji nie będzie się skalowała
i nie zobaczysz żadnego błędu.

### Czego wymaga CloudFront

Samo wgranie plików nie wystarczy. CloudFront z originem S3 przez OAC nie
rozwiązuje indeksów poza korzeniem, więc `/admin` zwróci 404, dopóki nie ustawisz:

- **Default root object**: `index.html`.
- **CloudFront Function** (viewer request) mapującą adresy bez rozszerzenia na
  pliki `.html` (`/admin` → `/admin.html`). Wyłącznie routing tras statycznych —
  tokeny są query stringiem i funkcja ich nie dotyka.
- **Response Headers Policy** z `Content-Security-Policy: frame-ancestors
  https://<strona-nadrzędna>`. To jedyne miejsce, w którym ten nagłówek istnieje
  na produkcji: `headers()` w `next.config.mjs` działa **tylko** w `next dev`,
  bo eksport statyczny nie ma czym ich wysłać.
- **Cache**: `/_next/static/*` długo i `immutable`, pliki HTML krótko.

> `netlify.toml` w tym katalogu pochodzi z wcześniejszego pomysłu, żeby to Netlify
> hostowało aplikację. Przy S3 + CloudFront jest nieużywany — Netlify serwuje
> teraz wyłącznie stronę nadrzędną z ramką.

## AWS integration — TODO

Nic z poniższych nie jest jeszcze zaimplementowane. Frontend ma tylko punkty
wpięcia i nie wie, co stoi za API.

- [ ] API Gateway przed lambdami; `NEXT_PUBLIC_API_BASE_URL` wskazuje na jego adres.
- [ ] Lambda `api` → Lambda `db` → PostgreSQL RDS. Kształt odpowiedzi ma zgadzać
      się z typami z `src/types/` — wtedy podmiana `usingMocks` wystarczy.
- [ ] Walidacja reguł po stronie serwera: okno do 2027-04-30, weekend = sobota
      + niedziela, święta i przerwa 23.12.2026 – 06.01.2027. Frontend też ich
      pilnuje, ale rozstrzyga backend.
- [ ] Tokeny decyzyjne i odwołania generowane po stronie serwera, jednorazowe,
      z terminem ważności. Dziś mock zwraca je na ekran — produkcyjnie idą tylko mailem.
- [ ] Lambda `api` → SQS → Lambda `mail-sender` → SES.
- [ ] SES → SNS → Lambda `bounce-handler`; wynik trafia w pole `bounce`
      z `AdminReservation` (typ już istnieje).
- [ ] EventBridge → Lambda `cleanup-expired` → RDS: `pending` po terminie
      przechodzi w `expired`.
- [ ] Feedback osobną ścieżką: API Gateway → Lambda → DynamoDB.
- [ ] Prawdziwa autoryzacja gospodarzy (token po stronie serwera) zamiast `?zoja`.
- [ ] Podłączenie Cloudflare Turnstile i weryfikacja tokenu w lambdzie
      (`src/components/reservation/TurnstileField.tsx`).
