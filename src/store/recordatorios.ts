/**
 * Estado de los recordatorios (HU-27). No se guarda en el celular.
 * La sincronización corre en el layout raíz (SincronizarRecordatorios) y la tarjeta de la
 * pantalla de Notificaciones lo lee:
 * - el permiso, compartido: si la persona lo concede en la tarjeta, la sincronización se entera;
 * - cuántos quedaron programados y el último error (CA3);
 * - "Reintentar", que sube `intento` para volver a sincronizar.
 */
import { create } from 'zustand';

/**
 * - por_activar: todavía se puede pedir (nunca se pidió, o Android permite pedirlo otra vez).
 * - bloqueado: ya no se puede pedir; hay que activarlo en los ajustes del celular.
 */
export type EstadoPermiso = 'cargando' | 'por_activar' | 'concedido' | 'bloqueado';

type EstadoRecordatorios = {
  permiso: EstadoPermiso;
  /** null mientras no se ha sincronizado. */
  programados: number | null;
  error: string | null;
  intento: number;
  registrarPermiso: (permiso: EstadoPermiso) => void;
  registrarProgramados: (cantidad: number) => void;
  registrarError: (mensaje: string) => void;
  reintentar: () => void;
};

export const useEstadoRecordatorios = create<EstadoRecordatorios>()((set) => ({
  permiso: 'cargando',
  programados: null,
  error: null,
  intento: 0,
  registrarPermiso: (permiso) => set({ permiso }),
  registrarProgramados: (cantidad) => set({ programados: cantidad, error: null }),
  registrarError: (mensaje) => set({ error: mensaje }),
  reintentar: () => set((estado) => ({ intento: estado.intento + 1, error: null })),
}));
