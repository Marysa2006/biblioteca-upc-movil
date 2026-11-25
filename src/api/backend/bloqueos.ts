import type { Bloqueo, Reserva } from '@/types';

import { ESTADO_DESDE_BACKEND, horaDesdeBackend, type EstadoBackend } from './equivalencias';

export type ReservaAfectadaBackend = {
  request_id: number;
  date: string;
  start_time: string;
  end_time: string;
  requester: string;
  status: EstadoBackend;
};

export type BloqueoBackend = {
  id: number;
  space: { id: number };
  start_date: string;
  end_date: string;
  start_time?: string | null;
  end_time?: string | null;
  reason: string;
  cancelled_reservations: ReservaAfectadaBackend[];
};

export function bloqueoDesdeBackend(bloqueo: BloqueoBackend): Bloqueo {
  return {
    id: String(bloqueo.id),
    espacioId: String(bloqueo.space.id),
    desde: bloqueo.start_date,
    hasta: bloqueo.end_date,
    horaInicio: bloqueo.start_time ? horaDesdeBackend(bloqueo.start_time) : undefined,
    horaFin: bloqueo.end_time ? horaDesdeBackend(bloqueo.end_time) : undefined,
    motivo: bloqueo.reason,
  };
}

export function reservaAfectadaDesdeBackend(
  reserva: ReservaAfectadaBackend,
  espacioId: string,
): Reserva {
  return {
    id: String(reserva.request_id),
    espacioId,
    fecha: reserva.date,
    horaInicio: horaDesdeBackend(reserva.start_time),
    horaFin: horaDesdeBackend(reserva.end_time),
    solicitante: reserva.requester,
    solicitanteId: '',
    proposito: '',
    asistentes: 0,
    estado: ESTADO_DESDE_BACKEND[reserva.status],
  };
}

export function bloqueoHaciaBackend(bloqueo: Omit<Bloqueo, 'id'>, confirm: boolean) {
  return {
    space: Number(bloqueo.espacioId),
    start_date: bloqueo.desde,
    end_date: bloqueo.hasta,
    start_time: bloqueo.horaInicio || null,
    end_time: bloqueo.horaFin || null,
    reason: bloqueo.motivo.trim(),
    confirm,
  };
}
