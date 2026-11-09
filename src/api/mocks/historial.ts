/**
 * DATOS DE PRUEBA del historial de solicitudes (HU-08, CA2).
 *
 * Un camino por cada solicitud de los mocks de reservas, asesorías, tablets y capacitaciones,
 * que termina en su estado actual. Los motivos, resultados y novedades son los de esos mocks.
 * Los préstamos usan el estado común (ver estadoDePrestamo en ../historial) y su estado real
 * va en la nota. Las fechas son relativas a hoy (fechasDemo): cada evento queda unos días antes de
 * su solicitud, o en su fecha si es la entrega o el cierre, en el orden en que pasó.
 */
import { sumarDias } from '@/utils/calendario';

import type { EventoGuardado } from '../historial';
import { FECHAS_CITAS } from './asesorias';
import { FECHAS_CAPACITACIONES, MOTIVOS_CAPACITACIONES } from './capacitaciones';
import { conHora, HOY } from './fechasDemo';
import { FECHAS_RESERVAS, RESERVAS } from './reservas';
import { FECHAS_PRESTAMOS } from './tablets';

/** `dias` antes de hoy, a esa hora. */
const hace = (dias: number, hora: string) => conHora(sumarDias(HOY, -dias), hora);

/** `dias` después (o antes, si es negativo) de la fecha de la solicitud, a esa hora. */
const el = (fecha: string, dias: number, hora: string) => conHora(sumarDias(fecha, dias), hora);

const PERSONAL = 'Personal de la biblioteca';
const LAURA = 'Laura Pérez';
const CARLOS = 'Carlos Ramírez';
const ANDRES = 'Andrés Mejía';
const JULIAN = 'Julián Mendoza';

export const HISTORIAL_SOLICITUDES: EventoGuardado[] = [
  // ── Reservas ──
  { id: 'evt-res-1-a', tipo: 'reserva', solicitudId: 'res-1', fecha: hace(3, '10:20'), estado: 'pendiente', autor: LAURA, nota: 'Solicitud enviada.' },
  { id: 'evt-res-2-a', tipo: 'reserva', solicitudId: 'res-2', fecha: hace(5, '09:00'), estado: 'pendiente', autor: CARLOS, nota: 'Solicitud enviada.' },
  { id: 'evt-res-2-b', tipo: 'reserva', solicitudId: 'res-2', fecha: hace(4, '08:30'), estado: 'aprobada', autor: PERSONAL },
  { id: 'evt-res-3-a', tipo: 'reserva', solicitudId: 'res-3', fecha: hace(4, '11:00'), estado: 'pendiente', autor: LAURA, nota: 'Solicitud enviada.' },
  { id: 'evt-res-3-b', tipo: 'reserva', solicitudId: 'res-3', fecha: hace(3, '09:10'), estado: 'rechazada', autor: PERSONAL, nota: 'El espacio está en mantenimiento ese día.' },
  { id: 'evt-res-4-a', tipo: 'reserva', solicitudId: 'res-4', fecha: hace(4, '15:40'), estado: 'pendiente', autor: ANDRES, nota: 'Solicitud enviada.' },
  { id: 'evt-res-4-b', tipo: 'reserva', solicitudId: 'res-4', fecha: hace(1, '08:15'), estado: 'cancelada', autor: ANDRES, nota: 'El solicitante canceló la reserva.' },
  { id: 'evt-res-5-a', tipo: 'reserva', solicitudId: 'res-5', fecha: el(FECHAS_RESERVAS['res-5'], -6, '16:00'), estado: 'pendiente', autor: LAURA, nota: 'Solicitud enviada.' },
  { id: 'evt-res-5-b', tipo: 'reserva', solicitudId: 'res-5', fecha: el(FECHAS_RESERVAS['res-5'], -5, '10:00'), estado: 'aprobada', autor: PERSONAL },
  { id: 'evt-res-5-c', tipo: 'reserva', solicitudId: 'res-5', fecha: el(FECHAS_RESERVAS['res-5'], 0, '17:05'), estado: 'realizada', autor: PERSONAL },
  { id: 'evt-res-6-a', tipo: 'reserva', solicitudId: 'res-6', fecha: hace(3, '14:30'), estado: 'pendiente', autor: CARLOS, nota: 'Solicitud enviada.' },
  { id: 'evt-res-6-b', tipo: 'reserva', solicitudId: 'res-6', fecha: hace(2, '09:45'), estado: 'nueva_fecha', autor: PERSONAL, nota: RESERVAS.find((reserva) => reserva.id === 'res-6')?.motivo },

  // ── Citas de asesoría (nacen aprobadas al agendar) ──
  { id: 'evt-cit-1-a', tipo: 'cita', solicitudId: 'cit-1', fecha: hace(2, '11:00'), estado: 'aprobada', autor: LAURA, nota: 'Asesoría agendada.' },
  { id: 'evt-cit-2-a', tipo: 'cita', solicitudId: 'cit-2', fecha: hace(1, '18:20'), estado: 'pendiente', autor: CARLOS, nota: 'Solicitud enviada.' },
  { id: 'evt-cit-3-a', tipo: 'cita', solicitudId: 'cit-3', fecha: el(FECHAS_CITAS['cit-3'], -4, '13:00'), estado: 'aprobada', autor: LAURA, nota: 'Asesoría agendada.' },
  { id: 'evt-cit-3-b', tipo: 'cita', solicitudId: 'cit-3', fecha: el(FECHAS_CITAS['cit-3'], 0, '09:40'), estado: 'realizada', autor: JULIAN, nota: 'Revisamos las referencias y quedaron ajustadas.' },
  { id: 'evt-cit-4-a', tipo: 'cita', solicitudId: 'cit-4', fecha: el(FECHAS_CITAS['cit-4'], -5, '10:30'), estado: 'aprobada', autor: CARLOS, nota: 'Asesoría agendada.' },
  { id: 'evt-cit-4-b', tipo: 'cita', solicitudId: 'cit-4', fecha: el(FECHAS_CITAS['cit-4'], -2, '07:50'), estado: 'cancelada', autor: CARLOS, nota: 'Se cruzó con una clase.' },
  { id: 'evt-cit-5-a', tipo: 'cita', solicitudId: 'cit-5', fecha: el(FECHAS_CITAS['cit-5'], -4, '12:10'), estado: 'aprobada', autor: ANDRES, nota: 'Asesoría agendada.' },

  // ── Préstamos de tablet (estado común; el real va en la nota) ──
  { id: 'evt-pre-1-a', tipo: 'prestamo', solicitudId: 'pre-1', fecha: hace(1, '17:00'), estado: 'aprobada', autor: LAURA, nota: 'Tablet reservada. Recógela en la biblioteca.' },
  { id: 'evt-pre-2-a', tipo: 'prestamo', solicitudId: 'pre-2', fecha: hace(2, '09:30'), estado: 'aprobada', autor: CARLOS, nota: 'Tablet reservada. Recógela en la biblioteca.' },
  { id: 'evt-pre-2-b', tipo: 'prestamo', solicitudId: 'pre-2', fecha: el(FECHAS_PRESTAMOS['pre-2'], 0, '08:05'), estado: 'aprobada', autor: PERSONAL, nota: 'Tablet entregada. Devuélvela antes de las 17:00.' },
  { id: 'evt-pre-3-a', tipo: 'prestamo', solicitudId: 'pre-3', fecha: el(FECHAS_PRESTAMOS['pre-3'], -3, '08:45'), estado: 'aprobada', autor: ANDRES, nota: 'Tablet reservada. Recógela en la biblioteca.' },
  { id: 'evt-pre-3-b', tipo: 'prestamo', solicitudId: 'pre-3', fecha: el(FECHAS_PRESTAMOS['pre-3'], 0, '10:03'), estado: 'aprobada', autor: PERSONAL, nota: 'Tablet entregada. Devuélvela antes de las 12:00.' },
  { id: 'evt-pre-3-c', tipo: 'prestamo', solicitudId: 'pre-3', fecha: el(FECHAS_PRESTAMOS['pre-3'], 0, '12:00'), estado: 'aprobada', autor: 'Sistema', nota: 'Préstamo vencido: pasó la hora límite (12:00) sin devolver la tablet.' },
  { id: 'evt-pre-4-a', tipo: 'prestamo', solicitudId: 'pre-4', fecha: el(FECHAS_PRESTAMOS['pre-4'], -2, '11:15'), estado: 'aprobada', autor: LAURA, nota: 'Tablet reservada. Recógela en la biblioteca.' },
  { id: 'evt-pre-4-b', tipo: 'prestamo', solicitudId: 'pre-4', fecha: el(FECHAS_PRESTAMOS['pre-4'], 0, '14:02'), estado: 'aprobada', autor: PERSONAL, nota: 'Tablet entregada. Devuélvela antes de las 16:00.' },
  { id: 'evt-pre-4-c', tipo: 'prestamo', solicitudId: 'pre-4', fecha: el(FECHAS_PRESTAMOS['pre-4'], 0, '16:15'), estado: 'realizada', autor: PERSONAL, nota: 'Tablet devuelta en estado regular, 15 min tarde. Novedad: La pantalla tiene una marca leve.' },

  // ── Capacitaciones ──
  { id: 'evt-cap-1-a', tipo: 'capacitacion', solicitudId: 'cap-1', fecha: hace(7, '09:12'), estado: 'pendiente', autor: LAURA, nota: 'Solicitud enviada.' },
  { id: 'evt-cap-2-a', tipo: 'capacitacion', solicitudId: 'cap-2', fecha: hace(7, '10:05'), estado: 'pendiente', autor: CARLOS, nota: 'Solicitud enviada.' },
  { id: 'evt-cap-2-b', tipo: 'capacitacion', solicitudId: 'cap-2', fecha: hace(6, '11:30'), estado: 'aprobada', autor: PERSONAL, nota: 'Responsable: Julián Mendoza.' },
  { id: 'evt-cap-3-a', tipo: 'capacitacion', solicitudId: 'cap-3', fecha: hace(6, '08:20'), estado: 'pendiente', autor: LAURA, nota: 'Solicitud enviada.' },
  { id: 'evt-cap-3-b', tipo: 'capacitacion', solicitudId: 'cap-3', fecha: hace(5, '10:00'), estado: 'nueva_fecha', autor: PERSONAL, nota: `${MOTIVOS_CAPACITACIONES['cap-3']} Nueva fecha: ${FECHAS_CAPACITACIONES['cap-3-propuesta']} a las 09:00.` },
  { id: 'evt-cap-4-a', tipo: 'capacitacion', solicitudId: 'cap-4', fecha: hace(8, '11:40'), estado: 'pendiente', autor: CARLOS, nota: 'Solicitud enviada.' },
  { id: 'evt-cap-4-b', tipo: 'capacitacion', solicitudId: 'cap-4', fecha: hace(7, '15:20'), estado: 'rechazada', autor: PERSONAL, nota: 'No hay facilitador disponible esa semana.' },
  { id: 'evt-cap-5-a', tipo: 'capacitacion', solicitudId: 'cap-5', fecha: hace(19, '15:30'), estado: 'pendiente', autor: LAURA, nota: 'Solicitud enviada.' },
  { id: 'evt-cap-5-b', tipo: 'capacitacion', solicitudId: 'cap-5', fecha: hace(18, '09:00'), estado: 'aprobada', autor: PERSONAL, nota: 'Responsable: Julián Mendoza.' },
  { id: 'evt-cap-5-c', tipo: 'capacitacion', solicitudId: 'cap-5', fecha: el(FECHAS_CAPACITACIONES['cap-5'], 0, '12:15'), estado: 'realizada', autor: JULIAN, nota: 'Se trabajó el catálogo y dos bases de datos. El grupo quedó con la guía.' },
];
