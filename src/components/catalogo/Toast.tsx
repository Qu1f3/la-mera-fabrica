"use client";

/**
 * Igual patrón que src/components/admin/ui/Toast.tsx, pero con el estilo
 * del sitio público (paleta terracota/arena/piedra/carbon) en vez del
 * neutro del panel administrativo -- ver src/app/globals.css. Se monta una
 * sola vez en (public)/layout.tsx.
 */
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type Toast = {
  id: number;
  mensaje: string;
  tipo: "exito" | "error";
};

type ToastContextValor = {
  mostrarToast: (mensaje: string, tipo?: Toast["tipo"]) => void;
};

const ToastContext = createContext<ToastContextValor | null>(null);

let siguienteId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrarToast = useCallback(
    (mensaje: string, tipo: Toast["tipo"] = "exito") => {
      const id = siguienteId++;
      setToasts((actuales) => [...actuales, { id, mensaje, tipo }]);
      setTimeout(() => {
        setToasts((actuales) => actuales.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ${
              toast.tipo === "error"
                ? "bg-red-600 text-white"
                : "bg-carbon text-white"
            }`}
          >
            {toast.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error("useToast() debe usarse dentro de <ToastProvider>.");
  }
  return contexto;
}
