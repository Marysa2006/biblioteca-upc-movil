/**
 * DATOS DE PRUEBA de las reservas y los bloqueos (HU-17, HU-18, HU-19 y HU-20).
 * Hay reservas en todos los estados, para que la disponibilidad, la bandeja y el calendario
 * tengan qué mostrar. Las fechas son relativas a hoy (fechasDemo): lo pendiente o aprobado, en
 * los próximos días hábiles; lo realizado, en días pasados.
 *
 * PROVISIONAL: usan los dos espacios confirmados por la biblioteca (Virtualteca y
 * Sala de Reuniones). El propósito y los asistentes son de ejemplo.
 */
import type { Bloqueo, Reserva } from '@/types';
import { fechaLegible } from '@/utils/fechas';

import { habil } from './fechasDemo';

/** Fechas de las reservas; el historial y las notificaciones las usan también. */
export const FECHAS_RESERVAS = {
  'res-1': habil(2),
  'res-2': habil(3),
  'res-3': habil(4),
  'res-4': habil(5),
  'res-5': habil(-2),
  'res-6': habil(6),
  /** La que propuso el personal para res-6. */
  'res-6-propuesta': habil(7),
  'blo-1': habil(8),
};

export const RESERVAS: Reserva[] = [
  {
    id: 'res-1',
    espacioId: 'esp-virtualteca',
    solicitanteId: 'u-estudiante',
    solicitante: 'Laura Pérez',
    fecha: FECHAS_RESERVAS['res-1'],
    horaInicio: '09:00',
    horaFin: '11:00',
    proposito: 'Consulta de bases de datos académicas',
    asistentes: 6,
    estado: 'pendiente',
  },
  {
    id: 'res-2',
    espacioId: 'esp-sala-reuniones',
    solicitanteId: 'u-docente',
    solicitante: 'Carlos Ramírez',
    fecha: FECHAS_RESERVAS['res-2'],
    horaInicio: '14:00',
    horaFin: '16:00',
    proposito: 'Reunión de comité curricular',
    asistentes: 8,
    estado: 'aprobada',
  },
  {
    id: 'res-3',
    espacioId: 'esp-virtualteca',
    solicitanteId: 'u-estudiante',
    solicitante: 'Laura Pérez',
    fecha: FECHAS_RESERVAS['res-3'],
    horaInicio: '08:00',
    horaFin: '10:00',
    proposito: 'Taller de búsqueda en el catálogo',
    asistentes: 15,
    estado: 'rechazada',
    motivo: 'El espacio está en mantenimiento ese día.',
  },
  {
    id: 'res-4',
    espacioId: 'esp-sala-reuniones',
    solicitanteId: 'u-estudiante-2',
    solicitante: 'Andrés Mejía',
    fecha: FECHAS_RESERVAS['res-4'],
    horaInicio: '10:00',
    horaFin: '12:00',
    proposito: 'Reunión de docentes',
    asistentes: 3,
    estado: 'cancelada',
    motivo: 'El solicitante canceló la reserva.',
  },
  {
    id: 'res-5',
    espacioId: 'esp-virtualteca',
    solicitanteId: 'u-estudiante',
    solicitante: 'Laura Pérez',
    fecha: FECHAS_RESERVAS['res-5'],
    horaInicio: '15:00',
    horaFin: '17:00',
    proposito: 'Consulta de recursos digitales',
    asistentes: 1,
    estado: 'realizada',
  },
  {
    id: 'res-6',
    espacioId: 'esp-sala-reuniones',
    solicitanteId: 'u-docente',
    solicitante: 'Carlos Ramírez',
    fecha: FECHAS_RESERVAS['res-6'],
    horaInicio: '11:00',
    horaFin: '13:00',
    proposito: 'Charla con estudiantes',
    asistentes: 20,
    estado: 'nueva_fecha',
    motivo: `Se propone mover la reserva al ${fechaLegible(FECHAS_RESERVAS['res-6-propuesta'])}.`,
  },
];

export const BLOQUEOS: Bloqueo[] = [
  {
    id: 'blo-1',
    espacioId: 'esp-sala-reuniones',
    desde: FECHAS_RESERVAS['blo-1'],
    hasta: FECHAS_RESERVAS['blo-1'],
    horaInicio: '08:00',
    horaFin: '12:00',
    motivo: 'Consejo de facultad',
  },
];
