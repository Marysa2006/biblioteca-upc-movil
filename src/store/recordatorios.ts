/**
 * Estado de la sincronización de los recordatorios (HU-27). No se guarda en el celular.
 * La sincronización corre en el layout raíz (SincronizarRecordatorios) y la tarjeta de la
 * pantalla de Notificaciones lo lee: cuántos quedaron programados, el último error (CA3) y
 * "Reintentar", que sube `intento` para volver a sincronizar.
 */
import { create } from 'zustand';

type EstadoRecordatorios = {
  /** null mientras no se ha sincronizado. */
  programados: number | null;
  error: string | null;
  intento: number;
  registrarProgramados: (cantidad: number) => void;
  registrarError: (mensaje: string) => void;
  reintentar: () => void;
};

export const useEstadoRecordatorios = create<EstadoRecordatorios>()((set) => ({
  programados: null,
  error: null,
  intento: 0,
  registrarProgramados: (cantidad) => set({ programados: cantidad, error: null }),
  registrarError: (mensaje) => set({ error: mensaje }),
  reintentar: () => set((estado) => ({ intento: estado.intento + 1, error: null })),
}));
