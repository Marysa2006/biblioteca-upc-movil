/**
 * «Mis solicitudes» del Backend traducidas a la app (HU-08). Funciones puras.
 *
 * - `GET /me/requests/` (paginada): todas las solicitudes de la persona, con `title` («Asesoría:
 *   Normas APA») y `scheduled_for` (cuándo es el servicio).
 * - `GET /me/requests/{id}/`: el detalle con el historial de estados.
 * El id es el de la solicitud, el mismo que usan las reservas, citas, préstamos y capacitaciones
 * de la app conectados a la API, así que el detalle encuentra cada una por su id.
 */
import type { EstadoSolicitud, EventoSolicitud, ResumenSolicitud, TipoSolicitud } from '@/types';

import { ESTADO_DESDE_BACKEND, type EstadoBackend } from './equivalencias';
import { ESTADO_PRESTAMO } from './tablets';

export type TipoBackend = 'TRAINING' | 'ADVISORY' | 'SPACE_RESERVATION' | 'TABLET_LOAN';

const TIPO_DESDE_BACKEND: Record<TipoBackend, TipoSolicitud> = {
  TRAINING: 'capacitacion',
  ADVISORY: 'cita',
  SPACE_RESERVATION: 'reserva',
  TABLET_LOAN: 'prestamo',
};

export type ResumenBackend = {
  id: number;
  service: TipoBackend;
  service_label: string;
  title: string;
  status: EstadoBackend;
  created_at: string;
  scheduled_for: string | null;
};

export type CambioBackend = {
  previous_status: string;
  new_status: EstadoBackend;
  reason: string;
  changed_by: string | null;
  created_at: string;
};

/**
 * El estado común de la app. El préstamo de tablet pasa por su propio estado (reservado,
 * entregado, vencido…), como en los datos de prueba: reservado y en curso cuentan como aprobada.
 */
export function estadoComun(tipo: TipoBackend, estado: EstadoBackend): EstadoSolicitud {
  if (tipo !== 'TABLET_LOAN') return ESTADO_DESDE_BACKEND[estado];
  const prestamo = ESTADO_PRESTAMO[estado];
  if (prestamo === 'devuelto') return 'realizada';
  if (prestamo === 'cancelado') return 'cancelada';
  return 'aprobada';
}

/** «2026-11-24T08:58:21-05:00» → fecha y hora locales que trae el Backend (Colombia). */
const fecha = (instante: string) => instante.slice(0, 10);
const hora = (instante: string) => instante.slice(11, 16);

export function resumenDesdeBackend(solicitud: ResumenBackend): ResumenSolicitud {
  // El título viene como «Asesoría: Normas APA»; la app ya muestra el tipo aparte.
  const prefijo = `${solicitud.service_label}: `;
  const titulo = solicitud.title.startsWith(prefijo)
    ? solicitud.title.slice(prefijo.length)
    : solicitud.title;
  const cuando = solicitud.scheduled_for;
  return {
    id: String(solicitud.id),
    tipo: TIPO_DESDE_BACKEND[solicitud.service],
    titulo,
    fecha: fecha(cuando ?? solicitud.created_at),
    ...(cuando ? { hora: hora(cuando) } : {}),
    estado: estadoComun(solicitud.service, solicitud.status),
  };
}

/** El historial, del cambio más antiguo al más reciente. */
export function historialDesdeBackend(
  id: number,
  tipo: TipoBackend,
  cambios: CambioBackend[],
): EventoSolicitud[] {
  return [...cambios]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((cambio, indice) => ({
      id: `${id}-${indice}`,
      fecha: `${fecha(cambio.created_at)} ${hora(cambio.created_at)}`,
      estado: estadoComun(tipo, cambio.new_status),
      autor: cambio.changed_by ?? 'Biblioteca',
      ...(cambio.reason?.trim() ? { nota: cambio.reason.trim() } : {}),
    }));
}
