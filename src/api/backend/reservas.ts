import type { DatosReservaTercero } from '../reservas';
import { horaDesdeBackend } from './equivalencias';
import { reservaDesdeBackend, type ReservaBackend } from './espacios';

export type ReservaPersonalBackend = Omit<ReservaBackend, 'space'> & {
  id: number;
  space: { id: number };
  requester: { id: string; full_name: string };
  history?: { reason?: string }[];
};

export function reservaPersonalDesdeBackend(reserva: ReservaPersonalBackend) {
  return {
    ...reservaDesdeBackend({ ...reserva, space: reserva.space.id }, {
      id: reserva.requester.id,
      nombre: reserva.requester.full_name,
    }),
    motivo: reserva.history?.at(-1)?.reason || undefined,
  };
}

export function reservaTerceroHaciaBackend(datos: DatosReservaTercero, correo: string) {
  return {
    requester_email: correo,
    space: Number(datos.espacioId),
    date: datos.fecha,
    start_time: datos.horaInicio,
    end_time: datos.horaFin,
    purpose: datos.proposito,
    estimated_attendees: datos.asistentes,
    additional_requirements: datos.requerimientos ?? '',
  };
}

export function franjasDeConflicto(cuerpo: unknown): string[] {
  if (!cuerpo || typeof cuerpo !== 'object' || !('alternative_slots' in cuerpo) ||
      !Array.isArray(cuerpo.alternative_slots)) return [];
  return cuerpo.alternative_slots.flatMap((franja) =>
    typeof franja?.start_time === 'string' && typeof franja?.end_time === 'string'
      ? [`${horaDesdeBackend(franja.start_time)}–${horaDesdeBackend(franja.end_time)}`] : [],
  );
}
