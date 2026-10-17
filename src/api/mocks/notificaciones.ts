/**
 * DATOS DE PRUEBA de las notificaciones (HU-27).
 * Son las de Laura Pérez (u-estudiante) y apuntan a sus reservas de prueba.
 */
import type { Notificacion } from '@/types';

export const NOTIFICACIONES: Notificacion[] = [
  {
    id: 'not-1',
    usuarioId: 'u-estudiante',
    titulo: 'Solicitud recibida',
    mensaje: 'Recibimos tu solicitud de reserva para el 19 de octubre. Está pendiente de revisión.',
    fecha: '2026-10-17 09:05',
    leida: true,
    solicitudId: 'res-1',
  },
  {
    id: 'not-2',
    usuarioId: 'u-estudiante',
    titulo: 'Reserva rechazada',
    mensaje: 'Tu solicitud del 21 de octubre fue rechazada: el espacio está en mantenimiento.',
    fecha: '2026-10-17 09:40',
    leida: false,
    solicitudId: 'res-3',
  },
  {
    id: 'not-3',
    usuarioId: 'u-estudiante',
    titulo: 'Recordatorio de tu reserva',
    mensaje: 'Recuerda tu reserva del 23 de octubre a las 15:00 en los cubículos de estudio.',
    fecha: '2026-10-22 08:00',
    leida: false,
    solicitudId: 'res-5',
  },
];
