import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Mosaicos y molduras para piso`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "es_HN",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Mosaicos y molduras para piso`,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Mosaicos y molduras para piso`,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
};

// Tipado explícito en vez de depender del helper `LayoutProps<"/">` que
// Next.js genera en `.next/types` — así el proyecto type-checkea incluso
// antes de haber corrido `next dev`/`next build` una primera vez.
export default function RootLayout({ children }: { children: ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Analítica opcional: mientras no configures NEXT_PUBLIC_GA_ID, no
            se carga ningún script ni se manda ningún dato a nadie. */}
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
