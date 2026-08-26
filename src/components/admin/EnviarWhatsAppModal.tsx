"use client";

import { useState } from "react";
import { Modal } from "./ui/Modal";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * Botón verde de WhatsApp que, antes de abrir el chat, muestra el mensaje
 * en un modal editable ("El mensaje debe poder editarse antes de abrir
 * WhatsApp" -- confirmación de pedido, pedido listo, etc). El botón
 * "Consultar por WhatsApp" del sitio público (WhatsAppButton.tsx) no
 * necesita esto porque ahí el mensaje es corto y genérico; acá el mensaje
 * trae datos concretos del pedido que a veces conviene ajustar antes de
 * enviar.
 */
export function EnviarWhatsAppModal({
  numero,
  mensajeInicial,
  tituloModal,
  textoBoton,
}: {
  numero: string | null | undefined;
  mensajeInicial: string;
  tituloModal: string;
  textoBoton: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState(mensajeInicial);

  if (!numero) return null;
  const url = buildWhatsAppUrl(numero, mensaje);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMensaje(mensajeInicial);
          setAbierto(true);
        }}
        className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-4 py-2 text-sm font-medium text-white hover:bg-[#1EBE57]"
      >
        {textoBoton}
      </button>

      <Modal isOpen={abierto} onClose={() => setAbierto(false)} titulo={tituloModal}>
        <p className="text-sm text-neutral-600">
          Puedes editar el mensaje antes de enviarlo.
        </p>
        <textarea
          value={mensaje}
          onChange={(evento) => setMensaje(evento.target.value)}
          rows={8}
          className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Cancelar
          </button>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setAbierto(false)}
              className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-4 py-2 text-sm font-medium text-white hover:bg-[#1EBE57]"
            >
              Abrir WhatsApp
            </a>
          )}
        </div>
      </Modal>
    </>
  );
}
