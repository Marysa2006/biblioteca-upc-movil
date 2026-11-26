/**
 * Asesorías del Backend traducidas a la app (HU-13 y HU-14, versión 1.1). Funciones puras.
 *
 * - Temas: `GET /advisories/topics/` (arreglo, solo activos) para la comunidad y
 *   `/advisories/manage/topics/` (paginada, con `is_active`) para quien administra asesorías.
 * - La cita (`Appointment`) se pide con fecha y hora deseadas y queda pendiente hasta que el
 *   personal la aprueba con fecha, horas, facilitador y enlace. En la app, su id es el
 *   `request_id`, el mismo de «Mis solicitudes» (`/me/requests/`); cancelar, reprogramar y
 *   calificar usan el `id` de la cita, que guarda src/api/asesorias.ts.
 */
import type { Cita, NuevaSolicitudCita, TemaAsesoria } from '@/types';
import { aHora, aMinutos } from '@/utils/franjas';

import { datosSolicitanteHaciaBackend } from './espacios';
import {
  ESTADO_DESDE_BACKEND,
  horaDesdeBackend,
  TIPO_DESDE_BACKEND,
  type EstadoBackend,
  type TipoUsuarioBackend,
} from './equivalencias';

export type TemaBackend = { id: number; name: string; description: string; is_active?: boolean };

export function temaDesdeBackend(tema: TemaBackend): TemaAsesoria {
  return {
    id: String(tema.id),
    nombre: tema.name,
    descripcion: tema.description,
    // La lista pública solo trae los activos y no dice `is_active`.
    activo: tema.is_active ?? true,
  };
}

export function temaHaciaBackend(tema: { nombre: string; descripcion: string; activo: boolean }) {
  return { name: tema.nombre, description: tema.descripcion, is_active: tema.activo };
}

export type CitaBackend = {
  id: number;
  request_id: number;
  status: EstadoBackend;
  topic_id: number;
  topic: string;
  modality: 'IN_PERSON' | 'VIRTUAL';
  need_description: string;
  desired_date: string;
  desired_time: string;
  scheduled_date: string | null;
  start_time: string | null;
  end_time: string | null;
  facilitator: string | null;
  facilitator_id?: string | null;
  virtual_link: string;
  subject: string;
  group_size: number;
  members: string[] | null;
  notes: string;
  rescheduled_from: number | null;
  attended: boolean | null;
  quality_rating: number | null;
  quality_comment: string;
};

const MODALIDAD_HACIA_BACKEND = { presencial: 'IN_PERSON', virtual: 'VIRTUAL' } as const;

/** Lo que manda la comunidad al pedir una asesoría (`AppointmentRequest`). */
export function citaHaciaBackend(nueva: NuevaSolicitudCita) {
  return {
    topic: Number(nueva.temaId),
    modality: MODALIDAD_HACIA_BACKEND[nueva.modalidad],
    need_description: nueva.necesidad,
    desired_date: nueva.fecha,
    desired_time: nueva.hora,
    ...datosSolicitanteHaciaBackend(nueva.datosSolicitante),
    subject: nueva.asignatura ?? '',
    group_size: nueva.personas,
    members: nueva.participantes,
    notes: nueva.novedades ?? '',
    accept_terms: nueva.terminosAceptados === true,
  };
}

/**
 * La cita como la usa la app. Mientras no se aprueba, la fecha y la hora son las pedidas y la
 * hora de fin sale de la duración de una asesoría (`advisory-duration-minutes`). Si el personal
 * cambió el día al aprobar, lo pedido queda en `fechaSolicitada` y `horaSolicitada`.
 */
export function citaDesdeBackend(
  cita: CitaBackend,
  solicitante: { id: string; nombre: string },
  duracionMinutos: number | null,
): Cita {
  const pedida = { fecha: cita.desired_date, hora: horaDesdeBackend(cita.desired_time) };
  const fecha = cita.scheduled_date ?? pedida.fecha;
  const horaInicio = cita.start_time ? horaDesdeBackend(cita.start_time) : pedida.hora;
  const horaFin = cita.end_time
    ? horaDesdeBackend(cita.end_time)
    : duracionMinutos == null
      ? ''
      : aHora(aMinutos(horaInicio) + duracionMinutos);
  const cambio =
    cita.scheduled_date != null && (fecha !== pedida.fecha || horaInicio !== pedida.hora);
  return {
    id: String(cita.request_id),
    temaId: String(cita.topic_id),
    tema: cita.topic,
    ...(cita.facilitator ? { facilitador: cita.facilitator } : {}),
    ...(cita.facilitator_id ? { facilitadorId: cita.facilitator_id } : {}),
    solicitanteId: solicitante.id,
    solicitante: solicitante.nombre,
    fecha,
    horaInicio,
    horaFin,
    necesidad: cita.need_description,
    modalidad: cita.modality === 'VIRTUAL' ? 'virtual' : 'presencial',
    estado: ESTADO_DESDE_BACKEND[cita.status],
    ...(cita.attended != null ? { asistio: cita.attended } : {}),
    personas: cita.group_size,
    participantes: cita.members ?? [],
    ...(cita.subject ? { asignatura: cita.subject } : {}),
    ...(cita.notes ? { novedades: cita.notes } : {}),
    terminosAceptados: true,
    ...(cita.virtual_link ? { enlaceVirtual: cita.virtual_link } : {}),
    ...(cambio ? { fechaSolicitada: pedida.fecha, horaSolicitada: pedida.hora } : {}),
    ...(cita.quality_rating != null
      ? {
          calificacion: {
            puntaje: cita.quality_rating,
            ...(cita.quality_comment ? { comentario: cita.quality_comment } : {}),
            fecha,
          },
        }
      : {}),
  };
}

export type CitaGestionBackend = CitaBackend & {
  requester: { name: string; email: string; user_type: TipoUsuarioBackend };
  program: string;
  result: string;
};

export type DetalleAgendaBackend = Pick<
  CitaBackend,
  | 'id'
  | 'request_id'
  | 'status'
  | 'topic'
  | 'start_time'
  | 'end_time'
  | 'modality'
  | 'virtual_link'
  | 'group_size'
  | 'subject'
  | 'members'
  | 'need_description'
  | 'attended'
  | 'quality_rating'
  | 'quality_comment'
> & {
  date: string;
  requester: string;
  requester_email: string;
  program?: string;
  result?: string;
};

export function citaGestionDesdeBackend(cita: CitaGestionBackend, duracion: number | null) {
  return {
    ...citaDesdeBackend(cita, { id: cita.requester.email, nombre: cita.requester.name }, duracion),
    solicitanteTipo: TIPO_DESDE_BACKEND[cita.requester.user_type],
    solicitantePrograma: cita.program || undefined,
    resultado: cita.result || undefined,
  };
}

export function citaAgendaDesdeBackend(cita: DetalleAgendaBackend, duracion: number | null) {
  const horaInicio = cita.start_time ? horaDesdeBackend(cita.start_time) : '';
  return {
    id: String(cita.request_id),
    temaId: '',
    tema: cita.topic,
    solicitanteId: cita.requester_email,
    solicitante: cita.requester,
    fecha: cita.date,
    horaInicio,
    horaFin: cita.end_time
      ? horaDesdeBackend(cita.end_time)
      : horaInicio && duracion != null
        ? aHora(aMinutos(horaInicio) + duracion)
        : '',
    necesidad: cita.need_description,
    modalidad: cita.modality === 'VIRTUAL' ? ('virtual' as const) : ('presencial' as const),
    estado: ESTADO_DESDE_BACKEND[cita.status],
    personas: cita.group_size,
    participantes: cita.members ?? [],
    asignatura: cita.subject || undefined,
    enlaceVirtual: cita.virtual_link || undefined,
    asistio: cita.attended ?? undefined,
    solicitantePrograma: cita.program || undefined,
    resultado: cita.result || undefined,
  };
}
