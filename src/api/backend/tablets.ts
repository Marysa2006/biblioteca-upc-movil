/**
 * Préstamo de tablets del Backend traducido a la app (HU-22 y HU-24, versión 1.1). Funciones
 * puras.
 *
 * - Disponibilidad: `GET /tablets/availability/?date=&hours=1` da, cada 30 minutos, cuántas
 *   tablets quedan libres para un préstamo de 1 hora; la app arma sus franjas de una hora con eso
 *   y calcula cuántas horas seguidas se pueden pedir, como con sus datos de prueba.
 * - Préstamo (`Loan`): la tablet se asigna al entregarla. En la app, su id es el `request_id`, el
 *   de «Mis solicitudes».
 * - Un 409 (`NoTablet`) trae los siguientes horarios con tablets (`next_slots`).
 */
import type { DatosSolicitante, EstadoFranja, EstadoPrestamo, Prestamo } from '@/types';
import { aMinutos } from '@/utils/franjas';

import { datosSolicitanteHaciaBackend } from './espacios';
import { horaDesdeBackend, type EstadoBackend } from './equivalencias';

export type DisponibilidadTabletsBackend = {
  date: string;
  slots: { start: string; end: string; available: number }[];
  message?: string | null;
};

export type FranjaTabletsApp = {
  horaInicio: string;
  horaFin: string;
  estado: EstadoFranja;
  libres: number;
  total: number;
  motivo?: string;
};

/**
 * Las franjas de un día. El Backend no dice cuántas tablets hay en total: se usa el mayor número
 * libre del día. Una hora de inicio que ya pasó no se ofrece.
 */
export function franjasTabletsDesdeBackend(
  dia: DisponibilidadTabletsBackend,
  ahora: Date = new Date(),
): FranjaTabletsApp[] {
  const total = Math.max(0, ...dia.slots.map((franja) => franja.available));
  return dia.slots.map((franja) => {
    const horaInicio = horaDesdeBackend(franja.start);
    const empieza = new Date(`${dia.date}T${horaInicio}:00`);
    let estado: EstadoFranja = 'disponible';
    let motivo: string | undefined;
    if (empieza < ahora) {
      estado = 'no_disponible';
      motivo = 'Ya pasó';
    } else if (franja.available === 0) {
      estado = 'reservada';
      motivo = 'No quedan tablets libres en esta franja.';
    }
    return {
      horaInicio,
      horaFin: horaDesdeBackend(franja.end),
      estado,
      libres: franja.available,
      total,
      ...(motivo ? { motivo } : {}),
    };
  });
}

/** Lo que manda la comunidad al pedir una tablet (`LoanRequest`). */
export function prestamoHaciaBackend(datos: {
  fecha: string;
  horaInicio: string;
  horas: number;
  aceptaCondiciones: boolean;
  responsabilidadAceptada: boolean;
  datosSolicitante: DatosSolicitante;
}) {
  return {
    date: datos.fecha,
    start_time: datos.horaInicio,
    hours: datos.horas,
    // El Backend tiene un solo «acepto»: las condiciones y la responsabilidad van juntas.
    accept_terms: datos.aceptaCondiciones && datos.responsabilidadAceptada,
    ...datosSolicitanteHaciaBackend(datos.datosSolicitante),
  };
}

export type PrestamoBackend = {
  id: number;
  request_id: number;
  status: EstadoBackend;
  tablet: string | null;
  tablet_model: string | null;
  reserved_date: string;
  start_time: string;
  due_date: string;
  due_time: string;
  conditions_accepted_at: string | null;
};

/** El estado del préstamo en la app: reservado, entregado, vencido, devuelto o cancelado. */
const ESTADO_PRESTAMO: Record<EstadoBackend, EstadoPrestamo> = {
  PENDING: 'reservado',
  APPROVED: 'reservado',
  RESCHEDULE_PROPOSED: 'reservado',
  IN_PROGRESS: 'entregado',
  OVERDUE: 'vencido',
  COMPLETED: 'devuelto',
  CANCELLED: 'cancelado',
  REJECTED: 'cancelado',
};

export function prestamoDesdeBackend(
  prestamo: PrestamoBackend,
  solicitante: { id: string; nombre: string },
): Prestamo {
  const horaInicio = horaDesdeBackend(prestamo.start_time);
  const horaLimite = horaDesdeBackend(prestamo.due_time);
  return {
    id: String(prestamo.request_id),
    // La tablet se asigna al entregarla: antes no hay; después, su código interno.
    tabletId: prestamo.tablet ?? '',
    solicitanteId: solicitante.id,
    solicitante: solicitante.nombre,
    fecha: prestamo.reserved_date,
    horaInicio,
    horaLimite,
    condicionesAceptadas: prestamo.conditions_accepted_at != null,
    estado: ESTADO_PRESTAMO[prestamo.status],
    horas: Math.round((aMinutos(horaLimite) - aMinutos(horaInicio)) / 60),
  };
}

/** Los siguientes horarios con tablets de un 409, como alternativas de la app. */
export function alternativasTabletDesdeBackend(
  tramos: { date: string; start: string; end: string }[],
) {
  return tramos.map((tramo) => ({
    fecha: tramo.date,
    horaInicio: horaDesdeBackend(tramo.start),
    horaLimite: horaDesdeBackend(tramo.end),
  }));
}
