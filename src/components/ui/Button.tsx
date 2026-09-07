"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "quiet";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?: Variant;
  /** Blokuje przycisk i podmienia napis — chroni przed dwuklikiem. */
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
  children: ReactNode;
}

/** Minimalny obszar dotyku ~44 px na każdym wariancie. */
const BASE =
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[14px] px-5 text-[15.5px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-70";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-card hover:bg-accentHover",
  secondary: "border border-line2 bg-cream text-ink2 hover:bg-cream2",
  danger: "border-[1.5px] border-terra bg-terra text-card hover:bg-terraInk",
  quiet: "text-[14.5px] font-semibold text-accentHover underline underline-offset-[3px] min-h-[44px]",
};

export function Button({
  variant = "primary",
  loading = false,
  loadingLabel,
  fullWidth = false,
  children,
  disabled,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${BASE} ${VARIANTS[variant]} ${fullWidth ? "w-full" : ""} ${loading ? "cursor-progress" : ""}`}
    >
      {loading && (
        <span
          aria-hidden
          className="h-[15px] w-[15px] animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
        />
      )}
      {loading ? (loadingLabel ?? children) : children}
    </button>
  );
}
