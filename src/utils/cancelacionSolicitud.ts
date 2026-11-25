import type { EstadoSolicitud } from '@/types';

export function puedeCancelarSolicitud(
  tipo: 'reserva' | 'capacitacion' | 'prestamo',
  estado: EstadoSolicitud,
  fecha: string,
  hora: string | undefined,
  plazo: number | undefined,
  ahora = Date.now(),
): boolean {
  if (tipo === 'capacitacion' && (estado === 'pendiente' || estado === 'nueva_fecha')) return true;
  if (estado !== 'aprobada' && !(tipo === 'reserva' && estado === 'pendiente')) return false;
  if (!hora) return false;
  const inicio = Date.parse(fecha + 'T' + hora + ':00-05:00');
  if (!(inicio > ahora)) return false;
  if (tipo === 'prestamo' || estado === 'pendiente') return true;
  return plazo != null && ahora <= inicio - plazo * 3_600_000;
}
