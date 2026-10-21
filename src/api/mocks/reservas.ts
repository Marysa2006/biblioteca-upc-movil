/**
 * DATOS DE PRUEBA de las reservas y los bloqueos (HU-17, HU-18, HU-19 y HU-20).
 * Hay reservas en todos los estados, repartidas entre esta semana y la próxima,
 * para que la disponibilidad, la bandeja y el calendario tengan qué mostrar.
 *
 * PROVISIONAL: usan los dos espacios confirmados por la biblioteca (Virtualteca y
 * Sala de Reuniones). El propósito y los asistentes son de ejemplo.
 */
import type { Bloqueo, Reserva } from '@/types';

export const RESERVAS: Reserva[] = [
  {
    id: 'res-1',
    espacioId: 'esp-virtualteca',
    solicitanteId: 'u-estudiante',
    solicitante: 'Laura Pérez',
    fecha: '2026-10-19',
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
    fecha: '2026-10-20',
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
    fecha: '2026-10-21',
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
    fecha: '2026-10-22',
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
    fecha: '2026-10-23',
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
    fecha: '2026-10-26',
    horaInicio: '11:00',
    horaFin: '13:00',
    proposito: 'Charla con estudiantes',
    asistentes: 20,
    estado: 'nueva_fecha',
    motivo: 'Se propone mover la reserva al 27 de octubre.',
  },
];

export const BLOQUEOS: Bloqueo[] = [
  {
    id: 'blo-1',
    espacioId: 'esp-sala-reuniones',
    desde: '2026-10-27',
    hasta: '2026-10-27',
    horaInicio: '08:00',
    horaFin: '12:00',
    motivo: 'Consejo de facultad',
  },
];
