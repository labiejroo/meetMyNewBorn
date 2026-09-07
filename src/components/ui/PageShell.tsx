"use client";

import { useEffect, type ReactNode } from "react";

import { useIframeResize } from "@/hooks/useIframeResize";

interface Props {
  children: ReactNode;
  /**
   * Cokolwiek, co zmienia widok. Zmiana wartości wymusza ponowny pomiar —
   * ResizeObserver łapie resztę sam.
   */
  revision?: unknown;
}

/**
 * Wspólna ramka strony. Mierzony jest ten wewnętrzny kontener, a nie `main`
 * z `min-h-screen`: w iframe 100vh równa się wysokości ramki, więc wysokość
 * nigdy nie mogłaby zmaleć.
 */
export function PageShell({ children, revision }: Props) {
  const { ref, notify } = useIframeResize<HTMLDivElement>();

  useEffect(() => {
    notify();
  }, [notify, revision]);

  return (
    <main className="flex min-h-screen flex-col items-center px-4">
      <div ref={ref} className="flex w-full max-w-[880px] flex-col gap-5 pb-[72px] pt-7">
        {children}
      </div>
    </main>
  );
}
