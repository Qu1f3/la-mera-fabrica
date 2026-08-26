import { EnConstruccion } from "@/components/admin/EnConstruccion";
export const metadata = { title: "Reportes — Panel administrativo" };
export default function ReportesPage() {
  return (
    <EnConstruccion
      titulo="Reportes"
      descripcion="Acá vas a poder generar reportes de ventas, producción, pagos, inventario y más, filtrados por fecha."
    />
  );
}
