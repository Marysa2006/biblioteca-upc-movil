/**
 * Reglas del inventario de tablets (HU-21, CA3) y de la entrega/devolución (HU-23).
 * Funciones puras, sin hooks.
 */
import type { CondicionTablet, EstadoTablet, Prestamo, Tablet } from '@/types';

/** Una tablet está operativa si no está en mantenimiento ni de baja. */
export function estaOperativa(tablet: Tablet): boolean {
  return tablet.estado !== 'mantenimiento' && tablet.estado !== 'de_baja';
}

/** Tablets que se pueden prestar: operativas y libres (HU-21, CA3). */
export function tabletsDisponibles(tablets: Tablet[]): Tablet[] {
  return tablets.filter((tablet) => tablet.estado === 'disponible');
}

/** Fecha y hora del momento en el formato del contrato: 'AAAA-MM-DD HH:MM'. */
export function ahoraFechaHora(ahora: Date = new Date()): string {
  const dos = (numero: number) => String(numero).padStart(2, '0');
  return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())} ${dos(
    ahora.getHours(),
  )}:${dos(ahora.getMinutes())}`;
}

/**
 * Minutos de retraso de una devolución (HU-23, CA4): 0 si llegó antes de la hora límite.
 * Se redondea hacia arriba para no perder un retraso de pocos segundos.
 */
export function minutosDeRetraso(prestamo: Prestamo, ahora: Date = new Date()): number {
  const limite = new Date(`${prestamo.fecha}T${prestamo.horaLimite}:00`);
  const diferencia = ahora.getTime() - limite.getTime();
  return diferencia > 0 ? Math.ceil(diferencia / 60000) : 0;
}

/** Estado de la tablet al entregarla (HU-23): queda en préstamo. */
export function estadoTabletAlEntregar(): EstadoTablet {
  return 'en_prestamo';
}

/** Estado de la tablet al devolverla (HU-23): mantenimiento si se dañó; disponible si no. */
export function estadoTabletAlDevolver(condicion: CondicionTablet): EstadoTablet {
  return condicion === 'danado' ? 'mantenimiento' : 'disponible';
}
