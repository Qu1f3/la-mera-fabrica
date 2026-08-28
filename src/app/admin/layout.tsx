import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";

// Layout compartido por TODO /admin (envuelve tanto "login" como
// "(protected)", sin agregar segmento a la URL) -- acá vive la
// configuración de PWA para que el panel se pueda "instalar" como app en
// Android/iPhone. El sitio público de catálogo NO tiene esto: cada rol usa
// el panel a diario como si fuera una app aparte (Roberto en su iPhone, su
// mamá en su Android), mientras que a un cliente del catálogo no le hace
// falta "instalar" el sitio.
export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Panel LMF",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#b5563c",
};

export default function AdminRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <RegisterServiceWorker />
      {children}
    </>
  );
}
