/**
 * Capacitaciones del Backend traducidas a la app (HU-09, HU-10 y HU-12). Funciones puras.
 *
 * - Líneas: `GET /trainings/lines/` (arreglo, solo activas) para la comunidad y
 *   `/trainings/lines/manage/` (paginada, con `is_active`) para quien administra la formación.
 * - Solicitud (`TrainingRequest`): su `id` es el de la solicitud, el mismo de «Mis solicitudes».
 *   El Backend no guarda los nombres de los participantes ni la asignatura aparte: la asignatura
 *   va junto al grupo en `group_or_subject`.
 */
import type {
  DatosSolicitante,
  LineaFormacion,
  ModalidadCapacitacion,
  SolicitanteCapacitacion,
  SolicitudCapacitacion,
} from '@/types';

import { datosSolicitanteHaciaBackend } from './espacios';
import { ESTADO_DESDE_BACKEND, horaDesdeBackend, type EstadoBackend } from './equivalencias';

export type LineaBackend = { id: number; name: string; description: string; is_active?: boolean };

export function lineaDesdeBackend(linea: LineaBackend): LineaFormacion {
  return {
    id: String(linea.id),
    nombre: linea.name,
    descripcion: linea.description ?? '',
    // La lista pública solo trae las activas y no dice `is_active`.
    activa: linea.is_active ?? true,
  };
}

export function lineaHaciaBackend(linea: { nombre: string; descripcion: string; activa: boolean }) {
  return {
    name: linea.nombre.trim(),
    description: linea.descripcion.trim(),
    is_active: linea.activa,
  };
}

const MODALIDAD_HACIA_BACKEND = { presencial: 'IN_PERSON', virtual: 'VIRTUAL' } as const;

/** El Backend también tiene `HYBRID`; la app no la ofrece y la muestra como presencial. */
function modalidadDesdeBackend(modalidad: string): ModalidadCapacitacion {
  return modalidad === 'VIRTUAL' ? 'virtual' : 'presencial';
}

/** Lo que manda la comunidad al pedir una capacitación (`TrainingRequestCreate`). */
export function capacitacionHaciaBackend(datos: {
  lineaId: string;
  modalidad: ModalidadCapacitacion;
  fecha: string;
  hora: string;
  objetivo: string;
  grupo: string;
  participantes: number;
  asignatura?: string;
  novedades?: string;
  datosSolicitante?: DatosSolicitante;
  terminosAceptados?: boolean;
}) {
  const asignatura = datos.asignatura?.trim();
  return {
    training_line: Number(datos.lineaId),
    modality: MODALIDAD_HACIA_BACKEND[datos.modalidad],
    desired_date: datos.fecha,
    desired_time: datos.hora,
    objective: datos.objetivo,
    group_or_subject: asignatura ? `${datos.grupo} · ${asignatura}` : datos.grupo,
    estimated_participants: datos.participantes,
    notes: datos.novedades ?? '',
    ...datosSolicitanteHaciaBackend(datos.datosSolicitante),
    accept_terms: datos.terminosAceptados === true,
  };
}

export type CapacitacionBackend = {
  id: number;
  status: EstadoBackend;
  training_line: { id: number; name: string };
  modality: string;
  desired_date: string;
  desired_time: string;
  objective?: string;
  group_or_subject?: string;
  estimated_participants: number;
  notes?: string;
  proposed_date: string | null;
  proposed_time: string | null;
  quality_rating?: number | null;
  quality_comment?: string;
  created_at: string;
  /** Solo en la bandeja del personal (`ManageTrainingRequest`). */
  requester?: string;
};

/** «2026-11-24T08:58:21-05:00» → «2026-11-24 08:58», en la hora de Colombia que trae. */
function fechaHoraDesdeBackend(instante: string): string {
  return `${instante.slice(0, 10)} ${instante.slice(11, 16)}`;
}

export function capacitacionDesdeBackend(
  solicitud: CapacitacionBackend,
  solicitante: SolicitanteCapacitacion,
): SolicitudCapacitacion {
  const propuesta =
    solicitud.proposed_date && solicitud.proposed_time
      ? {
          fechaPropuesta: solicitud.proposed_date,
          horaPropuesta: horaDesdeBackend(solicitud.proposed_time),
        }
      : {};
  return {
    id: String(solicitud.id),
    lineaId: String(solicitud.training_line.id),
    linea: solicitud.training_line.name,
    solicitante,
    modalidad: modalidadDesdeBackend(solicitud.modality),
    fecha: solicitud.desired_date,
    hora: horaDesdeBackend(solicitud.desired_time),
    objetivo: solicitud.objective ?? '',
    grupo: solicitud.group_or_subject ?? '',
    participantes: solicitud.estimated_participants,
    estado: ESTADO_DESDE_BACKEND[solicitud.status],
    ...propuesta,
    creada: fechaHoraDesdeBackend(solicitud.created_at),
    ...(solicitud.notes ? { novedades: solicitud.notes } : {}),
    terminosAceptados: true,
    ...(solicitud.quality_rating != null
      ? {
          calificacion: {
            puntaje: solicitud.quality_rating,
            ...(solicitud.quality_comment ? { comentario: solicitud.quality_comment } : {}),
            fecha: solicitud.desired_date,
          },
        }
      : {}),
  };
}
