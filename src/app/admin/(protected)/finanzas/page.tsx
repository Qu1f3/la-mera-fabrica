import { EnConstruccion } from "@/components/admin/EnConstruccion";
export const metadata = { title: "Finanzas — Panel administrativo" };
export default function FinanzasPage() {
  return (
    <EnConstruccion
      titulo="Finanzas"
      descripcion="Acá vas a registrar ingresos y gastos, y ver la utilidad aproximada por día, semana, mes o año."
    />
  );
}
