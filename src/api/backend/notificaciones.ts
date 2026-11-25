import type { Notificacion } from '@/types';

export type NotificacionBackend = {
  id: number;
  subject: string;
  body: string;
  created_at: string;
  is_read: boolean;
  request_id: number | null;
};

export function notificacionDesdeBackend(
  aviso: NotificacionBackend,
  usuarioId: string,
): Notificacion {
  return {
    id: String(aviso.id),
    usuarioId,
    titulo: aviso.subject,
    mensaje: aviso.body,
    fecha: `${aviso.created_at.slice(0, 10)} ${aviso.created_at.slice(11, 16)}`,
    leida: aviso.is_read,
    solicitudId: aviso.request_id === null ? '' : String(aviso.request_id),
  };
}
