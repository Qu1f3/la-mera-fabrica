import type { Metadata } from "next";
import type { ReactNode } from "react";

// page.tsx es Client Component ("use client", usa useActionState), así que
// no puede exportar `metadata` directamente -- Next.js sí permite ponerlo en
// el layout del segmento, que envuelve a la page sin volverla cliente.
export const metadata: Metadata = {
  title: "Iniciar sesión — Panel administrativo",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
