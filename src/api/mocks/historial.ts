/**
 * DATOS DE PRUEBA del historial de solicitudes (HU-08, CA2).
 *
 * Un camino por cada solicitud de los mocks de reservas, asesorías, tablets y capacitaciones,
 * que termina en su estado actual. Los motivos, resultados y novedades son los de esos mocks.
 * Los préstamos usan el estado común (ver estadoDePrestamo en ../historial) y su estado real
 * va en la nota. Las fechas son de ejemplo.
 */
import type { EventoGuardado } from '../historial';

const PERSONAL = 'Personal de la biblioteca';
const LAURA = 'Laura Pérez';
const CARLOS = 'Carlos Ramírez';
const ANDRES = 'Andrés Mejía';
const JULIAN = 'Julián Mendoza';

export const HISTORIAL_SOLICITUDES: EventoGuardado[] = [
  // ── Reservas ──
  { id: 'evt-res-1-a', tipo: 'reserva', solicitudId: 'res-1', fecha: '2026-10-15 10:20', estado: 'pendiente', autor: LAURA, nota: 'Solicitud enviada.' },
  { id: 'evt-res-2-a', tipo: 'reserva', solicitudId: 'res-2', fecha: '2026-10-14 09:00', estado: 'pendiente', autor: CARLOS, nota: 'Solicitud enviada.' },
  { id: 'evt-res-2-b', tipo: 'reserva', solicitudId: 'res-2', fecha: '2026-10-15 08:30', estado: 'aprobada', autor: PERSONAL },
  { id: 'evt-res-3-a', tipo: 'reserva', solicitudId: 'res-3', fecha: '2026-10-16 11:00', estado: 'pendiente', autor: LAURA, nota: 'Solicitud enviada.' },
  { id: 'evt-res-3-b', tipo: 'reserva', solicitudId: 'res-3', fecha: '2026-10-17 09:10', estado: 'rechazada', autor: PERSONAL, nota: 'El espacio está en mantenimiento ese día.' },
  { id: 'evt-res-4-a', tipo: 'reserva', solicitudId: 'res-4', fecha: '2026-10-17 15:40', estado: 'pendiente', autor: ANDRES, nota: 'Solicitud enviada.' },
  { id: 'evt-res-4-b', tipo: 'reserva', solicitudId: 'res-4', fecha: '2026-10-20 08:15', estado: 'cancelada', autor: ANDRES, nota: 'El solicitante canceló la reserva.' },
  { id: 'evt-res-5-a', tipo: 'reserva', solicitudId: 'res-5', fecha: '2026-10-18 16:00', estado: 'pendiente', autor: LAURA, nota: 'Solicitud enviada.' },
  { id: 'evt-res-5-b', tipo: 'reserva', solicitudId: 'res-5', fecha: '2026-10-19 10:00', estado: 'aprobada', autor: PERSONAL },
  { id: 'evt-res-5-c', tipo: 'reserva', solicitudId: 'res-5', fecha: '2026-10-23 17:05', estado: 'realizada', autor: PERSONAL },
  { id: 'evt-res-6-a', tipo: 'reserva', solicitudId: 'res-6', fecha: '2026-10-21 14:30', estado: 'pendiente', autor: CARLOS, nota: 'Solicitud enviada.' },
  { id: 'evt-res-6-b', tipo: 'reserva', solicitudId: 'res-6', fecha: '2026-10-22 09:45', estado: 'nueva_fecha', autor: PERSONAL, nota: 'Se propone mover la reserva al 27 de octubre.' },

  // ── Citas de asesoría (nacen aprobadas al agendar) ──
  { id: 'evt-cit-1-a', tipo: 'cita', solicitudId: 'cit-1', fecha: '2026-10-20 11:00', estado: 'aprobada', autor: LAURA, nota: 'Asesoría agendada.' },
  { id: 'evt-cit-2-a', tipo: 'cita', solicitudId: 'cit-2', fecha: '2026-10-24 18:20', estado: 'pendiente', autor: CARLOS, nota: 'Solicitud enviada.' },
  { id: 'evt-cit-3-a', tipo: 'cita', solicitudId: 'cit-3', fecha: '2026-10-15 13:00', estado: 'aprobada', autor: LAURA, nota: 'Asesoría agendada.' },
  { id: 'evt-cit-3-b', tipo: 'cita', solicitudId: 'cit-3', fecha: '2026-10-19 09:40', estado: 'realizada', autor: JULIAN, nota: 'Revisamos las referencias y quedaron ajustadas.' },
  { id: 'evt-cit-4-a', tipo: 'cita', solicitudId: 'cit-4', fecha: '2026-10-18 10:30', estado: 'aprobada', autor: CARLOS, nota: 'Asesoría agendada.' },
  { id: 'evt-cit-4-b', tipo: 'cita', solicitudId: 'cit-4', fecha: '2026-10-21 07:50', estado: 'cancelada', autor: CARLOS, nota: 'Se cruzó con una clase.' },
  { id: 'evt-cit-5-a', tipo: 'cita', solicitudId: 'cit-5', fecha: '2026-10-17 12:10', estado: 'aprobada', autor: ANDRES, nota: 'Asesoría agendada.' },

  // ── Préstamos de tablet (estado común; el real va en la nota) ──
  { id: 'evt-pre-1-a', tipo: 'prestamo', solicitudId: 'pre-1', fecha: '2026-10-21 17:00', estado: 'aprobada', autor: LAURA, nota: 'Tablet reservada. Recógela en la biblioteca.' },
  { id: 'evt-pre-2-a', tipo: 'prestamo', solicitudId: 'pre-2', fecha: '2026-10-20 09:30', estado: 'aprobada', autor: CARLOS, nota: 'Tablet reservada. Recógela en la biblioteca.' },
  { id: 'evt-pre-2-b', tipo: 'prestamo', solicitudId: 'pre-2', fecha: '2026-10-23 15:05', estado: 'aprobada', autor: PERSONAL, nota: 'Tablet entregada. Devuélvela antes de las 18:00.' },
  { id: 'evt-pre-3-a', tipo: 'prestamo', solicitudId: 'pre-3', fecha: '2026-10-19 08:45', estado: 'aprobada', autor: ANDRES, nota: 'Tablet reservada. Recógela en la biblioteca.' },
  { id: 'evt-pre-3-b', tipo: 'prestamo', solicitudId: 'pre-3', fecha: '2026-10-22 10:03', estado: 'aprobada', autor: PERSONAL, nota: 'Tablet entregada. Devuélvela antes de las 12:00.' },
  { id: 'evt-pre-3-c', tipo: 'prestamo', solicitudId: 'pre-3', fecha: '2026-10-22 12:00', estado: 'aprobada', autor: 'Sistema', nota: 'Préstamo vencido: pasó la hora límite (12:00) sin devolver la tablet.' },
  { id: 'evt-pre-4-a', tipo: 'prestamo', solicitudId: 'pre-4', fecha: '2026-10-20 11:15', estado: 'aprobada', autor: LAURA, nota: 'Tablet reservada. Recógela en la biblioteca.' },
  { id: 'evt-pre-4-b', tipo: 'prestamo', solicitudId: 'pre-4', fecha: '2026-10-22 14:02', estado: 'aprobada', autor: PERSONAL, nota: 'Tablet entregada. Devuélvela antes de las 16:00.' },
  { id: 'evt-pre-4-c', tipo: 'prestamo', solicitudId: 'pre-4', fecha: '2026-10-22 16:15', estado: 'realizada', autor: PERSONAL, nota: 'Tablet devuelta en estado regular, 15 min tarde. Novedad: La pantalla tiene una marca leve.' },

  // ── Capacitaciones ──
  { id: 'evt-cap-1-a', tipo: 'capacitacion', solicitudId: 'cap-1', fecha: '2026-10-28 09:12', estado: 'pendiente', autor: LAURA, nota: 'Solicitud enviada.' },
  { id: 'evt-cap-2-a', tipo: 'capacitacion', solicitudId: 'cap-2', fecha: '2026-10-28 10:05', estado: 'pendiente', autor: CARLOS, nota: 'Solicitud enviada.' },
  { id: 'evt-cap-2-b', tipo: 'capacitacion', solicitudId: 'cap-2', fecha: '2026-10-29 11:30', estado: 'aprobada', autor: PERSONAL, nota: 'Responsable: Julián Mendoza.' },
  { id: 'evt-cap-3-a', tipo: 'capacitacion', solicitudId: 'cap-3', fecha: '2026-10-29 08:20', estado: 'pendiente', autor: LAURA, nota: 'Solicitud enviada.' },
  { id: 'evt-cap-3-b', tipo: 'capacitacion', solicitudId: 'cap-3', fecha: '2026-10-30 10:00', estado: 'nueva_fecha', autor: PERSONAL, nota: 'El facilitador no puede el 12; se propone el 13 a la misma hora. Nueva fecha: 2026-11-13 a las 09:00.' },
  { id: 'evt-cap-4-a', tipo: 'capacitacion', solicitudId: 'cap-4', fecha: '2026-10-27 11:40', estado: 'pendiente', autor: CARLOS, nota: 'Solicitud enviada.' },
  { id: 'evt-cap-4-b', tipo: 'capacitacion', solicitudId: 'cap-4', fecha: '2026-10-28 15:20', estado: 'rechazada', autor: PERSONAL, nota: 'No hay facilitador disponible esa semana.' },
  { id: 'evt-cap-5-a', tipo: 'capacitacion', solicitudId: 'cap-5', fecha: '2026-10-16 15:30', estado: 'pendiente', autor: LAURA, nota: 'Solicitud enviada.' },
  { id: 'evt-cap-5-b', tipo: 'capacitacion', solicitudId: 'cap-5', fecha: '2026-10-17 09:00', estado: 'aprobada', autor: PERSONAL, nota: 'Responsable: Julián Mendoza.' },
  { id: 'evt-cap-5-c', tipo: 'capacitacion', solicitudId: 'cap-5', fecha: '2026-10-22 12:15', estado: 'realizada', autor: JULIAN, nota: 'Se trabajó el catálogo y dos bases de datos. El grupo quedó con la guía.' },
];
