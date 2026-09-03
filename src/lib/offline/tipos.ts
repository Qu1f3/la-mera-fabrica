/**
 * Tipos de la cola de sincronización sin conexión. Ver
 * propuesta-modo-offline.md y sync.ts.
 */

export type ItemColaProduccion = {
  id: string;
  tipo: "produccion";
  /** ISO, capturado en el dispositivo al momento de registrar (no cuando se sincroniza). */
  creadoEn: string;
  intentos: number;
  ultimoError?: string;
  payload: {
    idRegistro?: string;
    idMezcla?: string;
    empleadoId: string;
    productoId: string;
    cantidadProducida: number;
    unidadesDefectuosas: number;
    notas: string | null;
    hizoMezcla: boolean;
    montoMezcla: number;
  };
};

export type ItemColaExtra = {
  id: string;
  tipo: "extra";
  creadoEn: string;
  intentos: number;
  ultimoError?: string;
  payload: {
    id?: string;
    empleadoId: string;
    tipoPagoExtraId: string | null;
    descripcion: string;
    monto: number;
    notas: string | null;
  };
};

export type ItemColaMovimiento = {
  id: string;
  tipo: "movimiento";
  creadoEn: string;
  intentos: number;
  ultimoError?: string;
  payload: {
    idMovimiento?: string;
    idCompra?: string;
    idGasto?: string;
    materialId: string;
    tipo: "ENTRADA" | "SALIDA";
    cantidad: number;
    costo: number | null;
    notas: string | null;
    esCompra: boolean;
    proveedorId: string;
    esCredito: boolean;
  };
};

/**
 * Resumen del pedido en el servidor que se manda cuando cambiar el
 * estado o la fecha prometida choca contra un cambio más reciente de
 * otro dispositivo -- ver ConflictosPendientes.tsx y sync.ts.
 */
export type ConflictoPedido = {
  codigo: string;
  estado: string;
  fechaPrometida: string | null;
  actualizadoEn: string;
};

export type ItemPedidoParaCola = {
  productoId: string;
  categoria: string | null;
  diseno: string | null;
  color: string | null;
  cantidad: number;
  precioUnitario: number;
};

export type ItemColaPedido = {
  id: string;
  tipo: "pedido";
  creadoEn: string;
  intentos: number;
  ultimoError?: string;
  payload: {
    idPedido: string;
    codigo: string;
    clienteId?: string;
    clienteNuevo?: { id: string; nombre: string; telefono: string };
    items: ItemPedidoParaCola[];
    modoAnticipo: "PORCENTAJE" | "MONTO_FIJO";
    porcentajeAnticipo: number;
    montoAnticipoFijo: number;
    fechaPrometidaInput: string;
    notas: string | null;
    idIngreso?: string;
  };
};

/**
 * A diferencia de produccion/extra/movimiento, estas dos SÍ pueden entrar
 * en conflicto (editan un pedido que ya existe, no crean uno nuevo) -- ver
 * sync.ts y ConflictosPendientes.tsx. `conflicto` se llena cuando el
 * servidor responde 409; mientras esté presente, procesarCola deja de
 * reintentar este item solo -- hace falta que la persona decida
 * manualmente (ver propuesta-modo-offline.md, Fase 4).
 */
export type ItemColaPedidoEstado = {
  id: string;
  tipo: "pedidoEstado";
  creadoEn: string;
  intentos: number;
  ultimoError?: string;
  conflicto?: ConflictoPedido;
  payload: {
    pedidoId: string;
    estado: string;
    notas: string | null;
    idHistorial: string;
    versionEsperada: string;
    forzar?: boolean;
  };
};

export type ItemColaPedidoFecha = {
  id: string;
  tipo: "pedidoFecha";
  creadoEn: string;
  intentos: number;
  ultimoError?: string;
  conflicto?: ConflictoPedido;
  payload: {
    pedidoId: string;
    fechaPrometidaInput: string;
    versionEsperada: string;
    forzar?: boolean;
  };
};

export type ItemColaRiego = {
  id: string;
  tipo: "riego";
  creadoEn: string;
  intentos: number;
  ultimoError?: string;
  payload: {
    idRiego?: string;
    pedidoId: string;
    observacion: string | null;
  };
};

export type ItemColaEntrega = {
  id: string;
  tipo: "entrega";
  creadoEn: string;
  intentos: number;
  ultimoError?: string;
  payload: {
    idEntrega?: string;
    pedidoId: string;
    fechaProgramadaInput: string;
    notas: string | null;
  };
};

export type ItemCola =
  | ItemColaProduccion
  | ItemColaExtra
  | ItemColaMovimiento
  | ItemColaPedido
  | ItemColaPedidoEstado
  | ItemColaPedidoFecha
  | ItemColaRiego
  | ItemColaEntrega;
