/**
 * Tablets: inventario, préstamos y entrega/devolución (HU-21, HU-22, HU-23 y HU-24).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 *
 * Las fechas van como texto 'AAAA-MM-DD' y las horas como 'HH:MM', como en los parámetros
 * de HU-28.
 */

import type { EstadoSolicitud } from './solicitudes';

/** Estado operativo de una tablet en el inventario (HU-21). */
export type EstadoTablet = 'disponible' | 'prestada' | 'mantenimiento' | 'inactiva';

/** Condición física del equipo al entregarlo o recibirlo (HU-23). */
export type CondicionTablet = 'bueno' | 'regular' | 'danado';

/** Tablet del inventario (HU-21). */
export type Tablet = {
  id: string;
  /** Código interno de la biblioteca. */
  codigo: string;
  /** Serial del fabricante. */
  serial: string;
  modelo: string;
  accesorios: string[];
  estado: EstadoTablet;
};

/** Estado del equipo y sus accesorios en la entrega o la devolución (HU-23). */
export type RevisionTablet = {
  condicion: CondicionTablet;
  accesorios: string[];
  observaciones?: string;
};

/** Préstamo o reserva de una tablet (HU-22, HU-23 y HU-24). */
export type PrestamoTablet = {
  id: string;
  tabletId: string;
  solicitanteId: string;
  solicitante: string;
  /** Fecha y franja del préstamo, 'AAAA-MM-DD' y 'HH:MM'. */
  fecha: string;
  horaInicio: string;
  horaFin: string;
  /** Condiciones de uso aceptadas (HU-22); sin aceptarlas no se registra. */
  condicionesAceptadas: boolean;
  estado: EstadoSolicitud;
  /** Entrega (HU-23), 'AAAA-MM-DD HH:MM'. */
  entregadaEn?: string;
  entrega?: RevisionTablet;
  /** Devolución (HU-23), 'AAAA-MM-DD HH:MM'. */
  devueltaEn?: string;
  devolucion?: RevisionTablet;
  /** Novedades o daños detectados (HU-23). */
  novedades?: string;
  /** Minutos de retraso al devolver (HU-23, CA4). */
  retrasoMinutos?: number;
};

/** Condiciones de uso del préstamo de tablets (HU-22), provisionales. */
export type CondicionesTablet = {
  titulo: string;
  texto: string;
  /** Última actualización, 'AAAA-MM-DD'. */
  actualizada: string;
};
