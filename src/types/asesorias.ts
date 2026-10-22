/**
 * Asesorías: temas, jornadas, franjas y citas (HU-13, HU-14 y HU-15).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 *
 * Las fechas van como texto 'AAAA-MM-DD' y las horas como 'HH:MM', como en los parámetros
 * de HU-28. Las franjas se generan a partir de la jornada (HU-13) y se ofrecen en HU-14.
 */

import type { EstadoSolicitud } from './solicitudes';

/** Modalidad de una asesoría (HU-13). */
export type ModalidadAsesoria = 'presencial' | 'virtual';

/** Tema de asesoría que ofrece la biblioteca (HU-13). */
export type TemaAsesoria = {
  id: string;
  nombre: string;
  descripcion: string;
  /** Facilitador que atiende el tema. */
  facilitadorId: string;
  activo: boolean;
};

/**
 * Jornada recurrente de un tema (HU-13): el facilitador atiende ciertos días, en una franja,
 * con una duración por cita y unos cupos. Al guardarla se generan sus franjas.
 */
export type JornadaAsesoria = {
  id: string;
  temaId: string;
  facilitadorId: string;
  /** Días de la semana: 0 = domingo … 6 = sábado. */
  dias: number[];
  /** 'HH:MM'. */
  horaInicio: string;
  /** 'HH:MM'. */
  horaFin: string;
  /** Duración de cada cita en minutos (p. ej. 30, 45, 60). */
  duracionMinutos: number;
  /** Cupos por franja. */
  cupos: number;
  modalidad: ModalidadAsesoria;
  /** Vigencia, 'AAAA-MM-DD'. */
  vigenciaDesde: string;
  vigenciaHasta: string;
  /** Fechas excluidas, 'AAAA-MM-DD' (festivos, ausencias). */
  excepciones: string[];
  activa: boolean;
};

/**
 * Franja de atención concreta de un día, generada desde una jornada (HU-13) y ofrecida
 * en HU-14.
 */
export type FranjaAsesoria = {
  id: string;
  jornadaId: string;
  temaId: string;
  facilitadorId: string;
  /** 'AAAA-MM-DD'. */
  fecha: string;
  /** 'HH:MM'. */
  horaInicio: string;
  /** 'HH:MM'. */
  horaFin: string;
  cupos: number;
  /** Cupos ya tomados por citas pendientes o aprobadas. */
  ocupados: number;
};

/** Resultado que registra el facilitador al terminar la cita (HU-15). */
export type ResultadoCita = 'asistio' | 'no_asistio';

/** Cita agendada por un usuario (HU-14) y vista por el facilitador (HU-15). */
export type CitaAsesoria = {
  id: string;
  temaId: string;
  /** Nombre del tema, para mostrarlo sin otra consulta. */
  tema: string;
  franjaId: string;
  facilitadorId: string;
  /** Nombre del facilitador. */
  facilitador: string;
  solicitanteId: string;
  solicitante: string;
  /** 'AAAA-MM-DD' y 'HH:MM'. */
  fecha: string;
  horaInicio: string;
  horaFin: string;
  /** Qué necesita la persona (HU-14). */
  necesidad: string;
  modalidad: ModalidadAsesoria;
  estado: EstadoSolicitud;
  /** Motivo de la cancelación o del rechazo; vacío mientras no aplique. */
  motivo?: string;
  /** Resultado de la cita (HU-15); vacío mientras no se atienda. */
  resultado?: ResultadoCita;
};
