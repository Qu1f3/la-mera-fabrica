import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Solicitud enviada",
  robots: { index: false, follow: false },
};

// Se muestra solo cuando la solicitud se guardó pero todavía no hay un
// número de WhatsApp configurado en /admin/configuracion (ver
// buildWhatsAppUrl en src/lib/whatsapp.ts) — así el cliente igual recibe
// confirmación de que su solicitud llegó, aunque no se pueda abrir el chat.
export default function GraciasPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <h1 className="text-2xl font-semibold text-carbon">
        Recibimos tu solicitud
      </h1>
      <p className="mt-3 text-sm text-piedra">
        Guardamos tu cotización. Todavía no tenemos un número de WhatsApp
        configurado para responderte por ahí, así que nos pondremos en
        contacto contigo directamente.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-terracota px-5 py-2.5 text-sm font-medium text-white hover:bg-terracota-dark"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
