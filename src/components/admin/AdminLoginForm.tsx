"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { isApiError } from "@/types";

interface Props {
  onLogin: (password: string) => Promise<boolean>;
}

/**
 * Wejście do trybu gospodarzy.
 *
 * Pokazuje się w miejscu, w którym wcześniej był od razu link do panelu.
 * Sam parametr ?zoja nadal decyduje, czy ten blok w ogóle się renderuje —
 * ale to już tylko wygoda: o dostępie rozstrzyga backend przy każdym żądaniu.
 *
 * Hasła nie zapisujemy NIGDZIE: ani w localStorage, ani w sessionStorage, ani
 * w adresie. Żyje w stanie tego komponentu do momentu wysłania i zaraz potem
 * jest czyszczone.
 */
export function AdminLoginForm({ onLogin }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fieldId = useId();

  async function submit() {
    if (submitting || password.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      await onLogin(password);
      // Czyścimy niezależnie od wyniku — przy sukcesie i tak znikamy z ekranu,
      // a przy porażce nie zostawiamy hasła w polu na cudzym ekranie.
      setPassword("");
    } catch (caught) {
      // 401 to jedyny przypadek, który tłumaczymy wprost. Reszta dostaje
      // ogólny komunikat: szczegóły błędu serwera nie są niczyją sprawą.
      setError(
        isApiError(caught) && caught.status === 401
          ? "Nieprawidłowe hasło."
          : "Nie udało się zalogować. Spróbuj ponownie za chwilę.",
      );
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-[rgba(201,139,132,.45)] bg-[rgba(201,139,132,.10)] px-[18px] py-4">
      <p className="m-0 text-[13.5px] font-semibold text-terraInk">Tryb gospodarzy</p>

      <form
        className="flex flex-col gap-2.5 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="flex flex-1 flex-col gap-[7px]">
          <label htmlFor={fieldId} className="text-[13px] font-medium text-ink2">
            Hasło
          </label>
          <input
            id={fieldId}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-[50px] rounded-[13px] border border-line bg-cream px-3.5 text-[15px] text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
          />
        </div>

        <Button type="submit" loading={submitting} loadingLabel="Sprawdzanie…">
          Wejdź do panelu
        </Button>
      </form>

      {error && (
        <p className="m-0 text-[13.5px] leading-relaxed text-[#a4433c]" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
