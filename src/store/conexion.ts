/**
 * Estado de la conexión con el Backend: cuántas llamadas llevan más de unos segundos sin
 * responder. Lo escribe `peticion()` (src/api/cliente.ts) y lo leen los estados de carga.
 *
 * El servidor de pruebas (Render, plan gratis) se apaga cuando nadie lo usa, y la primera llamada
 * tarda hasta un minuto mientras arranca. Con esto la pantalla dice qué pasa en lugar de parecer
 * colgada. No se guarda en el celular: es solo del momento.
 */
import { create } from 'zustand';

type EstadoConexion = {
  /** Llamadas en curso que ya pasaron de `MS_CONEXION_LENTA`. */
  lentas: number;
};

/** Desde cuándo una llamada se considera lenta. */
export const MS_CONEXION_LENTA = 8000;

export const useConexion = create<EstadoConexion>(() => ({ lentas: 0 }));

/** Marca una llamada lenta más (`+1`) o una que terminó (`-1`). */
export function contarLlamadaLenta(cambio: 1 | -1) {
  useConexion.setState((estado) => ({ lentas: Math.max(0, estado.lentas + cambio) }));
}

/** Aviso para la persona mientras el servidor despierta. */
export const MENSAJE_CONEXION_LENTA =
  'Conectando con la biblioteca. La primera vez puede tardar hasta un minuto.';
