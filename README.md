# Odwiedziny u Zoi — frontend (Next.js + React + Tailwind)

Jednostronicowa apka do rezerwacji weekendowych odwiedzin. Bez backendu:
cały stan żyje w Reakcie (`lib/useBooking.ts`), dane początkowe są na sztywno
w `lib/seed.ts`, a wywołanie API jest zamarkowane w `lib/api.ts` (600 ms,
z przełącznikiem błędu w stopce interfejsu).

## Start

```bash
cd nextjs
npm install
npm run dev
```

## Przepływ rezerwacji

1. Gość klika wolny weekend (sobotę albo niedzielę — to zapisuje dzień przyjazdu).
2. Wysyła formularz → termin dostaje status **pending**: gość dostaje maila
   „prośba dotarła”, gospodarze — maila z linkiem potwierdzającym.
3. Gospodarze klikają „potwierdzam termin” → status **taken**, gość dostaje
   maila o pomyślnej rezerwacji. „Odrzucam” zwraca weekend do puli.

W interfejsie ten mail jest symulowany paskiem pod nagłówkiem
(`components/PendingBar.tsx`).

## Struktura

- `lib/dates.ts` — arytmetyka dat w UTC, siatka od poniedziałku, formaty PL,
  święta i przerwa świąteczna 23.12.2026 – 6.01.2027.
- `lib/useBooking.ts` — cała logika: parowanie weekendów, walidacja, tryb
  gospodarzy, toasty, ekrany wyniku.
- `components/WeekendPill.tsx` — para sobota+niedziela jako jedna pigułka
  w dwóch ostatnich kolumnach wiersza; połówka dnia przyjazdu ma pełny status,
  druga jest przygaszona (`secondDay="hatch"` daje wariant z kreskówką).
- `components/WeekdayCell.tsx` — ciche dni robocze; termin gospodarzy w środku
  tygodnia rysowany kreskowaną ramką, żeby nie udawał weekendu.

## Uwagi

- Kolory statusów są w `lib/status.ts` jako wartości hex, bo tinty liczymy
  dynamicznie (`rgba(color, alpha)`); paleta bazowa siedzi w `tailwind.config.ts`.
- Bez `localStorage`, bez natywnego `<form>`, bez bibliotek kalendarzowych.
- Minimalny obszar dotyku 44 px trzymany przez `min-h-[44px]` na wszystkich
  interaktywnych elementach.
