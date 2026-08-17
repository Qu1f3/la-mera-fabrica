import { PrismaClient } from "@prisma/client";

// Patrón estándar de Next.js para evitar abrir una conexión nueva a la base
// de datos en cada hot-reload durante desarrollo. En producción (Vercel) cada
// instancia serverless crea la suya y `globalForPrisma` no persiste entre
// invocaciones, que es el comportamiento correcto.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
