import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { WhatsAppButton } from "@/components/catalogo/WhatsAppButton";
import { CartIndicator } from "@/components/catalogo/CartIndicator";
import { MobileNav } from "@/components/layout/MobileNav";
import { construirLocalBusiness, jsonLdSeguro } from "@/lib/structured-data";

const ENLACES_NAV = [
  { href: "/", label: "Catálogo" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  { href: "/contacto", label: "Contacto" },
];

export default async function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  const config = await prisma.configuracion.findUnique({
    where: { id: "global" },
  });

  return (
    <div className="flex min-h-screen flex-col">
      {/* LocalBusiness en todas las páginas públicas: la ubicación del
          negocio (Nacaome, Valle, Honduras) es un dato confirmado desde la
          Fase 0, y el resto de campos solo aparece si está cargado en
          /admin/configuracion — ver src/lib/structured-data.ts. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSeguro(construirLocalBusiness(config)),
        }}
      />
      <header className="relative border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold text-carbon"
          >
            <Image
              src="/logo-emblema.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9"
              priority
            />
            La Mera Fábrica
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-piedra sm:gap-6">
            <div className="hidden gap-6 sm:flex">
              {ENLACES_NAV.map((enlace) => (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  className="hover:text-terracota"
                >
                  {enlace.label}
                </Link>
              ))}
            </div>
            <CartIndicator />
            <MobileNav enlaces={ENLACES_NAV} />
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-neutral-200 bg-arena">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-piedra sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/logo-emblema.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7"
              />
              <p className="font-medium text-carbon">La Mera Fábrica</p>
            </div>
            <p className="mt-2">
              Mosaicos y molduras para piso — Nacaome, Valle, Honduras.
            </p>
            {config?.direccion && <p>{config.direccion}</p>}
            {config?.horarioAtencion && <p>{config.horarioAtencion}</p>}
            {(config?.facebookUrl || config?.instagramUrl) && (
              <p className="mt-2 flex gap-3">
                {config.facebookUrl && (
                  <a
                    href={config.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-terracota"
                  >
                    Facebook
                  </a>
                )}
                {config.instagramUrl && (
                  <a
                    href={config.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-terracota"
                  >
                    Instagram
                  </a>
                )}
              </p>
            )}
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <nav className="flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/nosotros" className="hover:text-terracota">
                Nosotros
              </Link>
              <Link href="/preguntas-frecuentes" className="hover:text-terracota">
                Preguntas frecuentes
              </Link>
              <Link href="/contacto" className="hover:text-terracota">
                Contacto
              </Link>
            </nav>
            {config?.whatsappNumero && (
              <WhatsAppButton
                numero={config.whatsappNumero}
                mensaje="Hola, quisiera más información sobre sus productos."
                contexto="footer"
              >
                Escríbenos por WhatsApp
              </WhatsAppButton>
            )}
          </div>
        </div>
        <div className="border-t border-neutral-200 px-4 py-4 text-xs text-piedra sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} La Mera Fábrica</p>
            <nav className="flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/politica-de-privacidad" className="hover:text-terracota">
                Política de Privacidad
              </Link>
              <Link href="/terminos-y-condiciones" className="hover:text-terracota">
                Términos y Condiciones
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
