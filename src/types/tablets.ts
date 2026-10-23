/**
 * Tablets: inventario, préstamos y entrega/devolución (HU-21, HU-22, HU-23 y HU-24).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 *
 * Las fechas van como texto 'AAAA-MM-DD' y las horas como 'HH:MM', como en los parámetros
 * de HU-28.
 */

/** Estado operativo de una tablet en el inventario (HU-21). */
export type EstadoTablet = 'disponible' | 'en_prestamo' | 'mantenimiento' | 'de_baja';

/** Condición física del equipo al entregarlo o recibirlo (HU-23). */
export type CondicionTablet = 'bueno' | 'regular' | 'danado';

/** Estado de un préstamo (HU-21, HU-22, HU-23 y HU-24). */
export type EstadoPrestamo = 'reservado' | 'entregado' | 'devuelto' | 'vencido' | 'cancelado';

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

/** Entrega o devolución de una tablet (HU-23). */
export type RegistroTablet = {
  /** Fecha y hora del registro, 'AAAA-MM-DD HH:MM'. */
  fechaHora: string;
  condicion: CondicionTablet;
  accesorios: string[];
  /** Solo en la devolución: daños o faltantes (CA3). */
  novedades?: string;
  /** Solo en la devolución: llegó después de la hora límite (CA4). */
  tardia?: boolean;
  /** Solo en la devolución: minutos de retraso, si fue tardía. */
  retrasoMinutos?: number;
};

/** Préstamo o reserva de una tablet (HU-22, HU-23 y HU-24). */
export type Prestamo = {
  id: string;
  tabletId: string;
  solicitanteId: string;
  solicitante: string;
  /** 'AAAA-MM-DD'. */
  fecha: string;
  /** Inicio de la franja, 'HH:MM'. */
  horaInicio: string;
  /** Hora límite para devolver, 'HH:MM' del mismo día. */
  horaLimite: string;
  /** Condiciones de uso aceptadas (HU-22); sin aceptarlas no se registra. */
  condicionesAceptadas: boolean;
  estado: EstadoPrestamo;
  /** Registro de la entrega (HU-23), si ya se entregó. */
  entrega?: RegistroTablet;
  /** Registro de la devolución (HU-23), si ya se devolvió. */
  devolucion?: RegistroTablet;
};

/** Condiciones de uso del préstamo de tablets (HU-22), provisionales. */
export type CondicionesTablet = {
  titulo: string;
  texto: string;
  /** Última actualización, 'AAAA-MM-DD'. */
  actualizada: string;
};
