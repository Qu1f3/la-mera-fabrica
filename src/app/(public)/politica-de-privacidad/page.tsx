import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Cómo La Mera Fábrica recopila, usa y protege la información de sus visitantes y clientes.",
};

// Contenido redactado a partir de respuestas reales del dueño (Roberto
// Quiroz, 2026-08-28) sobre cómo funciona el negocio hoy -- NO es una
// revisión hecha por un abogado. Si más adelante el dueño quiere que
// alguien con conocimiento legal en Honduras lo revise o ajuste, esta
// misma estructura por secciones hace fácil reemplazar cualquier parte.
const ULTIMA_ACTUALIZACION = "28 de agosto de 2026";

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-carbon">{titulo}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-neutral-700">
        {children}
      </div>
    </section>
  );
}

export default function PoliticaDePrivacidadPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-semibold text-carbon sm:text-3xl">
        Política de Privacidad
      </h1>
      <p className="mt-2 text-sm text-piedra">
        Última actualización: {ULTIMA_ACTUALIZACION}
      </p>

      <Seccion titulo="1. Introducción">
        <p>
          La Mera Fábrica es un negocio dedicado a la fabricación y venta de
          mosaicos y molduras para piso, ubicado en Nacaome, Valle, Honduras.
          Esta política explica qué información recopilamos a través de
          este sitio, cómo la usamos y cómo la protegemos.
        </p>
      </Seccion>

      <Seccion titulo="2. Qué información recopilamos">
        <p>
          Cuando solicitas una cotización a través del sitio, te pedimos tu
          nombre, número de teléfono y correo electrónico, junto con los
          productos que te interesan. Además, medimos de forma anónima
          cuántas personas visitan el sitio (ver la sección 7, &quot;Cookies
          y tecnologías similares&quot;).
        </p>
      </Seccion>

      <Seccion titulo="3. Cómo usamos la información">
        <p>
          Usamos tu nombre, teléfono y correo para platicar sobre tu
          cotización y, si decides hacer el pedido, para darle seguimiento
          hasta la entrega. También podemos usarlos más adelante para
          contactarte con promociones y novedades de La Mera Fábrica.
        </p>
      </Seccion>

      <Seccion titulo="4. Con quién compartimos la información">
        <p>
          No compartimos tu información con terceros externos. Dentro del
          negocio, únicamente el dueño y los gerentes (ambos familiares
          directos del dueño) tienen acceso a estos datos, y solo para
          poder atender tu cotización o pedido.
        </p>
      </Seccion>

      <Seccion titulo="5. Cómo protegemos la información">
        <p>
          Tu información se guarda en un sistema de uso interno del
          negocio, al que solo pueden entrar el dueño y los gerentes con su
          propia cuenta. La conservamos mientras tengas una cotización o
          pedido en curso, o mientras sea razonable para llevar el historial
          del negocio.
        </p>
      </Seccion>

      <Seccion titulo="6. Tus derechos">
        <p>
          Puedes pedirnos en cualquier momento que corrijamos o eliminemos
          tu información, o que dejemos de contactarte con promociones,
          escribiendo a{" "}
          <a
            href="mailto:quirozroberto293@gmail.com"
            className="text-terracota underline"
          >
            quirozroberto293@gmail.com
          </a>{" "}
          (Roberto Quiroz).
        </p>
      </Seccion>

      <Seccion titulo="7. Cookies y tecnologías similares">
        <p>
          Este sitio no usa cookies de rastreo. Usamos Vercel Analytics para
          saber cuántas personas visitan el sitio, de forma agregada y
          anónima, sin cookies y sin recopilar información que nos permita
          identificar a una persona en particular.
        </p>
      </Seccion>

      <Seccion titulo="8. Cambios a esta política">
        <p>
          Si actualizamos esta política, publicaremos la nueva versión en
          esta misma página junto con la fecha de actualización.
        </p>
      </Seccion>

      <Seccion titulo="9. Contacto">
        <p>
          Si tienes alguna pregunta sobre esta política, puedes escribirnos
          a{" "}
          <a
            href="mailto:quirozroberto293@gmail.com"
            className="text-terracota underline"
          >
            quirozroberto293@gmail.com
          </a>{" "}
          (Roberto Quiroz).
        </p>
      </Seccion>
    </main>
  );
}
