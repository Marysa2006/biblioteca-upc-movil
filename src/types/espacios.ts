/**
 * Espacios, reservas, bloqueos y disponibilidad (HU-16, HU-17, HU-18, HU-19 y HU-20).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 *
 * Las fechas van como texto 'AAAA-MM-DD' y las horas como 'HH:MM', como en los parámetros
 * de HU-28. Las dos parejas comparten estos tipos: el contrato se fusiona antes que las HU.
 */

import type { EstadoSolicitud } from './solicitudes';

/** Espacio reservable de la biblioteca (HU-16). */
export type Espacio = {
  id: string;
  nombre: string;
  descripcion: string;
  /** Número máximo de asistentes que admite. */
  capacidad: number;
  /** Fotografía del espacio; vacío mientras no tenga (HU-16, CA2). */
  foto?: string;
  /** Horario de funcionamiento propio del espacio, para mostrar al usuario. */
  horario: string;
  /** Un espacio inactivo no se ofrece para reservar (HU-16, CA3). */
  activo: boolean;
};

/** Reserva de un espacio (HU-17, HU-18 y HU-19). */
export type Reserva = {
  id: string;
  /** Espacio reservado. */
  espacioId: string;
  /** Id del usuario que reserva, para "Mis solicitudes" (HU-08). */
  solicitanteId: string;
  /** Nombre de quien reserva, para la bandeja del personal (HU-19). */
  solicitante: string;
  /** Fecha de la reserva, 'AAAA-MM-DD'. */
  fecha: string;
  /** Hora de inicio, 'HH:MM'. */
  horaInicio: string;
  /** Hora de finalización, 'HH:MM'. */
  horaFin: string;
  proposito: string;
  asistentes: number;
  estado: EstadoSolicitud;
  /** Motivo del rechazo o la cancelación (HU-19, CA2); vacío mientras no aplique. */
  motivo?: string;
  /** Requerimientos adicionales que pide el usuario (HU-18). */
  requerimientos?: string;
};

/** Bloqueo institucional de un espacio (HU-20). */
export type Bloqueo = {
  id: string;
  espacioId: string;
  /** Primer día del bloqueo, 'AAAA-MM-DD'. */
  desde: string;
  /** Último día del bloqueo, 'AAAA-MM-DD' (igual a 'desde' si es un solo día). */
  hasta: string;
  /**
   * Franja dentro de esos días (HU-20: "por franja"); vacío = todo el día.
   * 'HH:MM'.
   */
  horaInicio?: string;
  horaFin?: string;
  motivo: string;
};

/**
 * Estado de una franja en el calendario de un espacio (HU-17, CA2).
 * 'no_disponible': ya pasó o no cumple la anticipación mínima de los parámetros (HU-28).
 */
export type EstadoFranja = 'disponible' | 'reservada' | 'bloqueada' | 'no_disponible';

/**
 * Franja de una hora dentro del horario de atención (HU-17).
 * Nunca lleva datos de quien reservó: la disponibilidad es pública (HU-17, CA3).
 */
export type FranjaDisponibilidad = {
  /** 'HH:MM'. */
  horaInicio: string;
  /** 'HH:MM'. */
  horaFin: string;
  estado: EstadoFranja;
  /** Motivo del bloqueo o de no estar disponible; vacío si está disponible o reservada. */
  motivo?: string;
};

/** Disponibilidad de un espacio en un día (HU-17), la que devuelve useDisponibilidad(). */
export type DiaDisponibilidad = {
  /** 'AAAA-MM-DD'. */
  fecha: string;
  /** false si es festivo o no tiene horario de atención: esDiaHabil() de HU-28. */
  habil: boolean;
  /** motivoNoDisponible() cuando el día no es hábil. */
  motivo?: string;
  /** Vacío cuando el día no es hábil. */
  franjas: FranjaDisponibilidad[];
};
