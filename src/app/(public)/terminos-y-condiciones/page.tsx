import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Condiciones de uso del sitio de La Mera Fábrica y de las cotizaciones solicitadas a través de él.",
};

// Contenido redactado a partir de respuestas reales del dueño (Roberto
// Quiroz, 2026-08-28) sobre cómo funciona el negocio hoy -- NO es una
// revisión hecha por un abogado. Si más adelante el dueño quiere que
// alguien con conocimiento legal en Honduras lo revise o ajuste, esta
// misma estructura por secciones hace fácil reemplazar cualquier parte.
// Nota interna: el negocio aún no tiene RTN propio (el dueño cumple 21
// años, requisito para tramitarlo, hasta 2027) -- por eso no se incluye
// un RTN en este documento. Agregarlo aquí cuando lo tengan.
const ULTIMA_ACTUALIZACION = "28 de agosto de 2026";

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-carbon">{titulo}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-neutral-700">
        {children}
      </div>
    </section>
  );
}

export default function TerminosYCondicionesPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-semibold text-carbon sm:text-3xl">
        Términos y Condiciones
      </h1>
      <p className="mt-2 text-sm text-piedra">
        Última actualización: {ULTIMA_ACTUALIZACION}
      </p>

      <Seccion titulo="1. Aceptación de los términos">
        <p>
          Al usar este sitio o solicitar una cotización a través de él,
          aceptas estos términos y condiciones.
        </p>
      </Seccion>

      <Seccion titulo="2. Descripción del servicio">
        <p>
          Este sitio muestra el catálogo de mosaicos y molduras para piso de
          La Mera Fábrica y te permite armar una cotización para
          enviárnosla por WhatsApp. No es una tienda en línea con pago ni
          compra automática — la compra y el pedido siempre se confirman
          directamente con nosotros.
        </p>
      </Seccion>

      <Seccion titulo="3. Uso del sitio">
        <p>
          Al solicitar una cotización, te pedimos que la información que
          nos das (nombre, teléfono, productos de interés) sea real, para
          poder darte un seguimiento correcto. No está permitido usar el
          sitio para fines fraudulentos o para enviarnos información falsa.
        </p>
      </Seccion>

      <Seccion titulo="4. Precios y disponibilidad">
        <p>
          Este sitio no muestra precios en el catálogo. La disponibilidad de
          los productos puede cambiar sin previo aviso. El precio final de
          tu pedido siempre se confirma al platicar tu cotización con
          nosotros por WhatsApp.
        </p>
      </Seccion>

      <Seccion titulo="5. Pedidos y pagos">
        <p>
          Un pedido se confirma con un anticipo; el monto y la forma de
          pago se acuerdan por WhatsApp según el pedido. El tiempo de
          producción y entrega varía según el volumen del pedido y la
          demanda del momento, y te lo confirmamos directamente al momento
          de tomar tu pedido.
        </p>
      </Seccion>

      <Seccion titulo="6. Propiedad intelectual">
        <p>
          Las fotos, textos, logo y diseño de este sitio son propiedad de
          La Mera Fábrica y no pueden reproducirse ni usarse sin nuestro
          permiso.
        </p>
      </Seccion>

      <Seccion titulo="7. Limitación de responsabilidad">
        <p>
          Si tu pedido llega con algún defecto de fabricación, lo
          resolvemos caso por caso. Como práctica del negocio, solemos
          entregar algunas piezas adicionales junto con el pedido para
          cubrir imprevistos durante la instalación (roturas, cortes,
          etc.); esto no es una garantía formal ni un compromiso fijo para
          todos los pedidos. La Mera Fábrica no se hace responsable por
          daños causados por un mal uso o una mala instalación del
          producto por parte de terceros.
        </p>
      </Seccion>

      <Seccion titulo="8. Cambios a estos términos">
        <p>
          Si actualizamos estos términos, publicaremos la nueva versión en
          esta misma página junto con la fecha de actualización.
        </p>
      </Seccion>

      <Seccion titulo="9. Contacto">
        <p>
          Si tienes alguna pregunta sobre estos términos, puedes
          escribirnos a{" "}
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
