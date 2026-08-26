import "server-only";
import { prisma } from "@/lib/prisma";

// Sin 0/O/1/I/L -- se prestan a confusión cuando alguien lee el código en
// voz alta o lo transcribe a mano (ver instrucción: "evitar caracteres
// confusos").
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const LARGO_CODIGO = 8;

function generarCodigoAleatorio(): string {
  let codigo = "";
  for (let i = 0; i < LARGO_CODIGO; i++) {
    codigo += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }
  return codigo;
}

/**
 * Genera un código único de pedido (ej: "9K7XM2QF"), visible al cliente en
 * el tracker público (/estado-pedido/[codigo]). `codigo` tiene un
 * constraint único a nivel de base de datos (ver prisma/schema.prisma); acá
 * además se revisa antes de intentar guardar y se reintenta ante una
 * colisión, que con 8 caracteres de un alfabeto de 31 símbolos es
 * extremadamente improbable pero no imposible.
 */
export async function generarCodigoPedido(): Promise<string> {
  for (let intento = 0; intento < 10; intento++) {
    const codigo = generarCodigoAleatorio();
    const existente = await prisma.pedido.findUnique({
      where: { codigo },
      select: { id: true },
    });
    if (!existente) return codigo;
  }
  throw new Error(
    "No se pudo generar un código de pedido único después de varios intentos."
  );
}
