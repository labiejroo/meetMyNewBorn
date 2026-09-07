/**
 * Origin strony rodzica bierzemy ze zmiennej środowiskowej — domena rodziny
 * nigdzie nie jest zapisana w kodzie. Bez tej zmiennej zostaje samo 'self',
 * czyli osadzenie w obcym iframe jest zablokowane.
 */
const parentOrigin = process.env.NEXT_PUBLIC_PARENT_ORIGIN?.trim();
const frameAncestors = ["'self'", parentOrigin].filter(Boolean).join(" ");

/**
 * `headers()` nie działa przy `output: "export"` — nie ma serwera, który mógłby
 * je dodać, a Next tylko ostrzega i idzie dalej. Zostawiamy je więc wyłącznie
 * dla `next dev`, żeby lokalna ramka testowała tę samą politykę co produkcja.
 *
 * NA PRODUKCJI CSP USTAWIA RESPONSE HEADERS POLICY W CLOUDFRONT.
 * Jeśli szukasz nagłówka frame-ancestors i nie ma go w odpowiedzi z S3 —
 * to nie jest błąd builda, tylko brakująca konfiguracja dystrybucji.
 */
const devOnlyHeaders =
  process.env.NODE_ENV === "development"
    ? {
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "Content-Security-Policy", value: `frame-ancestors ${frameAncestors};` },
              ],
            },
          ];
        },
      }
    : {};

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build produkuje statyczny katalog out/ do wgrania na S3.
  output: "export",
  ...devOnlyHeaders,
};

export default nextConfig;
