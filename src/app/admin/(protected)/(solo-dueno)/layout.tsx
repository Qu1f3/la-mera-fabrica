import type { ReactNode } from "react";
import { requireRolAdmin } from "@/lib/supabase/adminUsuario";

/**
 * Route group (no agrega segmento a la URL: /admin/clientes sigue siendo
 * /admin/clientes) que agrupa TODAS las secciones que solo debe ver un
 * AdminUsuario con rol ADMIN: Clientes, Cotizaciones, Empleados, Calendario,
 * Finanzas, Productos, Categorías, Contenido, Configuración.
 *
 * Un usuario con rol EMPLEADO (ej. un "mini administrador" que solo debe ver
 * Pedidos/Producción/Extras/Pagos semanales/Inventario/Reportes) que entra a
 * cualquier URL bajo estas 9 secciones -- por un enlace viejo, un favorito
 * guardado, o escribiéndola directo -- es redirigido por `requireRolAdmin()`
 * antes de que se renderice nada de la página real. Un solo layout aquí
 * cubre las 9 secciones (y todas sus rutas anidadas, como clientes/[id] o
 * productos/[id]/nuevo) de una vez, en vez de repetir el chequeo en cada
 * page.tsx -- así no hay riesgo de olvidar agregarlo a una página nueva
 * dentro de estas secciones.
 */
export default async function SoloDuenoLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRolAdmin();
  return <>{children}</>;
}
