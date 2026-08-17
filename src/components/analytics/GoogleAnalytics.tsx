import Script from "next/script";

/**
 * Google Analytics 4, cargado solo cuando hay un ID real configurado (ver
 * NEXT_PUBLIC_GA_ID en .env.example) — nunca se inventa uno ni se carga por
 * defecto. Se eligió GA4 porque su capa gratuita cubre por completo las
 * necesidades de este sitio (ver restricción de costos operativos, Fase 0).
 */
export function GoogleAnalytics({ gaId }: { gaId: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
