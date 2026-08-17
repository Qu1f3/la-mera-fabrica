import "server-only";
import { headers } from "next/headers";

/**
 * Límite de solicitudes en memoria — pensado para un sitio de bajo tráfico
 * en un solo proceso (no serverless multi-instancia, no Vercel Edge). No usa
 * Redis ni ningún servicio de pago, para mantener el costo operativo en
 * cero, tal como pide el proyecto. Si el proceso se reinicia, el conteo se
 * reinicia con él — es una mitigación básica contra abuso automatizado, no
 * una defensa perfecta.
 */
const intentos = new Map<string, number[]>();

// Limpieza ocasional para no acumular entradas de IPs que ya no vuelven.
function limpiarViejos(ahora: number, ventanaMs: number) {
  for (const [clave, marcas] of intentos) {
    const vigentes = marcas.filter((t) => ahora - t < ventanaMs);
    if (vigentes.length === 0) intentos.delete(clave);
    else intentos.set(clave, vigentes);
  }
}

/**
 * Devuelve true si la IP actual ya alcanzó el límite de intentos dentro de
 * la ventana de tiempo indicada, y registra el intento actual si no lo ha
 * alcanzado.
 */
export async function excedioLimite(
  accion: string,
  maximo: number,
  ventanaMs: number
): Promise<boolean> {
  const encabezados = await headers();
  const ip =
    encabezados.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    encabezados.get("x-real-ip") ||
    "desconocida";
  const clave = `${accion}:${ip}`;
  const ahora = Date.now();

  if (Math.random() < 0.01) limpiarViejos(ahora, ventanaMs);

  const marcas = (intentos.get(clave) ?? []).filter(
    (t) => ahora - t < ventanaMs
  );

  if (marcas.length >= maximo) {
    intentos.set(clave, marcas);
    return true;
  }

  marcas.push(ahora);
  intentos.set(clave, marcas);
  return false;
}
