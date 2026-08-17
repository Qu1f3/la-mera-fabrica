import type { NextConfig } from "next";

// Content-Security-Policy: restringe de dónde puede cargar el sitio
// scripts/estilos/imágenes/conexiones. 'unsafe-inline' en script-src es
// necesario porque Google Analytics (src/components/analytics/GoogleAnalytics.tsx)
// inyecta un pequeño script de inicialización en línea — usar un nonce por
// request es la alternativa "correcta", pero añade una capa de
// infraestructura (generarlo en el proxy y pasarlo a cada layout) que no se
// justifica para el tamaño de este sitio. GA4 solo se carga si
// NEXT_PUBLIC_GA_ID está configurado (ver ese componente).
//
// 'unsafe-eval' SOLO se agrega en desarrollo: React/Next.js (Turbopack) usan
// eval() en `npm run dev` para el hot-reload y para reconstruir stack traces
// legibles. En producción (`npm run build && npm run start`, o el build que
// hace Vercel) React nunca usa eval(), así que ahí se aplica la política más
// estricta sin excepción.
const esDesarrollo = process.env.NODE_ENV !== "production";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${esDesarrollo ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.supabase.co https://www.google-analytics.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://www.google-analytics.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Aplica a todas las rutas del sitio (público y /admin).
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          // Refuerza frame-ancestors de la CSP para navegadores viejos que
          // no la reconozcan.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      // El límite por defecto de un Server Action es 1MB — muy poco para
      // subir fotos de producto. El bucket de Storage ya limita cada
      // archivo a 5MB (ver src/lib/storage.ts); esto deja margen para subir
      // varias fotos de una vez en el panel.
      bodySizeLimit: "20mb",
    },
  },
  images: {
    // Fotos de producto subidas a Supabase Storage (bucket público "productos").
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
