import { prisma } from "@/lib/prisma";
import { Tabs } from "@/components/admin/ui/Tabs";
import { PLANTILLAS_WHATSAPP_DEFECTO, VARIABLES_PLANTILLA } from "@/lib/whatsapp";
import { ConfiguracionGeneralForm } from "./ConfiguracionGeneralForm";
import { PlantillaForm } from "./PlantillaForm";

export const metadata = { title: "Configuración — Panel administrativo" };

export default async function ConfiguracionPage() {
  const config = await prisma.configuracion.findUnique({
    where: { id: "global" },
  });

  // Fase 9: las plantillas de WhatsApp se crean solas la primera vez que
  // hacen falta, con el texto por defecto de src/lib/whatsapp.ts -- mismo
  // criterio "on-demand" que ya se usaba para AdminUsuario. `update: {}` no
  // pisa nada si el admin ya la había editado antes.
  for (const plantilla of PLANTILLAS_WHATSAPP_DEFECTO) {
    await prisma.plantillaMensaje.upsert({
      where: { clave: plantilla.clave },
      create: { clave: plantilla.clave, nombre: plantilla.nombre, cuerpo: plantilla.cuerpo },
      update: {},
    });
  }
  const plantillas = await prisma.plantillaMensaje.findMany({ orderBy: { nombre: "asc" } });

  const tabGeneral = <ConfiguracionGeneralForm config={config} />;

  const tabPlantillas = (
    <div className="mt-6 max-w-xl space-y-4">
      <p className="text-sm text-neutral-600">
        Estos son los mensajes con los que arranca el botón de WhatsApp de cada pedido
        (confirmación al recibirlo, aviso cuando está listo). Las variables entre llaves
        dobles, como {"{{nombreCliente}}"}, se reemplazan solas con el dato real de cada
        pedido. Siempre se puede editar el mensaje a mano justo antes de enviarlo.
      </p>
      {plantillas.map((plantilla) => (
        <PlantillaForm
          key={plantilla.id}
          plantilla={plantilla}
          variables={VARIABLES_PLANTILLA[plantilla.clave] ?? []}
        />
      ))}
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Configuración
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">
        Estos datos alimentan el botón de WhatsApp, el pie de página y el
        contacto en todo el sitio público. Mientras un campo quede vacío, lo
        que dependa de él simplemente no se muestra (por ejemplo, el botón de
        WhatsApp no aparece hasta que pongas el número).
      </p>

      <div className="mt-4">
        <Tabs
          tabs={[
            { clave: "general", etiqueta: "General", contenido: tabGeneral },
            { clave: "plantillas", etiqueta: "Plantillas de WhatsApp", contenido: tabPlantillas },
          ]}
        />
      </div>
    </div>
  );
}
