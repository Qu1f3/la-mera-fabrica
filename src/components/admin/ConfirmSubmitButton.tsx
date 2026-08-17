"use client";

/**
 * Botón de submit que pide confirmación antes de disparar una acción
 * destructiva (borrar categoría, borrar producto, borrar imagen). Vive en un
 * componente cliente porque `confirm()` es una API del navegador; el resto
 * del formulario que lo envuelve sigue siendo un Server Action normal.
 *
 * `formAction` es opcional: al pasarlo, este botón dispara una Server Action
 * distinta a la del `action` del `<form>` que lo envuelve (así se puede tener
 * "Guardar" y "Borrar" en el mismo formulario sin anidar dos `<form>`).
 */
export function ConfirmSubmitButton({
  confirmMessage,
  formAction,
  className = "",
  children,
}: {
  confirmMessage: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      formAction={formAction}
      className={className}
      onClick={(evento) => {
        if (!confirm(confirmMessage)) {
          evento.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
