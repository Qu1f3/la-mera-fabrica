// Sube un respaldo de la base de datos (.dump de pg_dump) al bucket privado
// "respaldos-bd" de Supabase Storage, y borra los respaldos con mas de
// RETENTION_DAYS dias para no acumular espacio de storage sin limite.
//
// Uso: node upload.mjs <ruta-local-del-archivo> <nombre-en-el-bucket>
// Variables de entorno requeridas: NEXT_PUBLIC_SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY. Opcional: RETENTION_DAYS (default 30).

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";

const BUCKET = "respaldos-bd";

const [, , rutaLocal, nombreArchivo] = process.argv;
if (!rutaLocal || !nombreArchivo) {
  console.error("Uso: node upload.mjs <ruta-local> <nombre-en-el-bucket>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno."
  );
  process.exit(1);
}

const retentionDays = Number(process.env.RETENTION_DAYS || "30");

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function asegurarBucket() {
  const { data: existente } = await supabase.storage.getBucket(BUCKET);
  if (existente) return;

  // Privado a proposito -- a diferencia de los buckets de imagenes del
  // sitio, un respaldo de la base de datos completa nunca debe ser publico.
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false,
  });
  if (error && !error.message?.toLowerCase().includes("already exists")) {
    throw new Error(`No se pudo crear el bucket ${BUCKET}: ${error.message}`);
  }
}

async function subirRespaldo() {
  const contenido = await readFile(rutaLocal);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(nombreArchivo, contenido, {
      contentType: "application/octet-stream",
      upsert: false,
    });
  if (error) {
    throw new Error(`No se pudo subir el respaldo: ${error.message}`);
  }
  console.log(`Respaldo subido: ${BUCKET}/${nombreArchivo} (${contenido.length} bytes)`);
}

async function borrarRespaldosViejos() {
  const { data: archivos, error } = await supabase.storage.from(BUCKET).list("", {
    limit: 1000,
    sortBy: { column: "created_at", order: "asc" },
  });
  if (error) {
    throw new Error(`No se pudo listar el bucket ${BUCKET}: ${error.message}`);
  }

  const limite = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const viejos = (archivos ?? [])
    .filter((archivo) => {
      const creado = archivo.created_at ? new Date(archivo.created_at).getTime() : NaN;
      return Number.isFinite(creado) && creado < limite;
    })
    .map((archivo) => archivo.name);

  if (viejos.length === 0) {
    console.log(`Sin respaldos viejos que borrar (retencion: ${retentionDays} dias).`);
    return;
  }

  const { error: errorBorrar } = await supabase.storage.from(BUCKET).remove(viejos);
  if (errorBorrar) {
    // No se tumba el job por esto -- el respaldo de hoy ya se subio bien,
    // que falle la limpieza no debe verse como que el respaldo fallo.
    console.error(`Aviso: no se pudieron borrar algunos respaldos viejos: ${errorBorrar.message}`);
    return;
  }
  console.log(`Respaldos borrados (mas de ${retentionDays} dias): ${viejos.join(", ")}`);
}

await asegurarBucket();
await subirRespaldo();
await borrarRespaldosViejos();
