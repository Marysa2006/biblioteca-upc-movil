/**
 * DATOS DE PRUEBA de las notificaciones (HU-27).
 * Son las de Laura Pérez (u-estudiante) y apuntan a sus reservas de prueba. Las fechas son
 * relativas a hoy, como las de las reservas (fechasDemo).
 */
import type { Notificacion } from '@/types';
import { sumarDias } from '@/utils/calendario';
import { fechaLegible } from '@/utils/fechas';

import { conHora, HOY } from './fechasDemo';
import { FECHAS_RESERVAS } from './reservas';

const hace = (dias: number, hora: string) => conHora(sumarDias(HOY, -dias), hora);

export const NOTIFICACIONES: Notificacion[] = [
  {
    id: 'not-1',
    usuarioId: 'u-estudiante',
    titulo: 'Solicitud recibida',
    mensaje: `Recibimos tu solicitud de reserva para el ${fechaLegible(FECHAS_RESERVAS['res-1'])}. Está pendiente de revisión.`,
    fecha: hace(3, '10:25'),
    leida: true,
    solicitudId: 'res-1',
  },
  {
    id: 'not-2',
    usuarioId: 'u-estudiante',
    titulo: 'Reserva rechazada',
    mensaje: `Tu solicitud del ${fechaLegible(FECHAS_RESERVAS['res-3'])} fue rechazada: el espacio está en mantenimiento.`,
    fecha: hace(3, '09:10'),
    leida: false,
    solicitudId: 'res-3',
  },
  {
    id: 'not-3',
    usuarioId: 'u-estudiante',
    titulo: 'Recordatorio de tu reserva',
    mensaje: `Recuerda tu reserva del ${fechaLegible(FECHAS_RESERVAS['res-5'])} a las 15:00 en la Virtualteca.`,
    fecha: conHora(FECHAS_RESERVAS['res-5'], '08:00'),
    leida: false,
    solicitudId: 'res-5',
  },
];
