/**
 * Reglas del inventario de tablets (HU-21, CA3), de la disponibilidad por franja (HU-22) y
 * de la entrega/devolución (HU-23). Funciones puras, sin hooks.
 */
import type { CondicionTablet, EstadoPrestamo, EstadoTablet, Prestamo, Tablet } from '@/types';

/** Una tablet está operativa si no está en mantenimiento ni de baja. */
export function estaOperativa(tablet: Tablet): boolean {
  return tablet.estado !== 'mantenimiento' && tablet.estado !== 'de_baja';
}

/** Tablets que se pueden prestar: operativas y libres (HU-21, CA3). */
export function tabletsDisponibles(tablets: Tablet[]): Tablet[] {
  return tablets.filter((tablet) => tablet.estado === 'disponible');
}

/** Estados de préstamo que ocupan la tablet en su franja; devuelto y cancelado la liberan. */
export const ESTADOS_PRESTAMO_OCUPAN: readonly EstadoPrestamo[] = [
  'reservado',
  'entregado',
  'vencido',
];

/**
 * ¿El préstamo ocupa su tablet en la franja? Mismo día y horas que se cruzan (HU-22).
 * Las horas 'HH:MM' se comparan como texto porque tienen ancho fijo.
 */
export function prestamoOcupaFranja(
  prestamo: Prestamo,
  fecha: string,
  horaInicio: string,
  horaLimite: string,
): boolean {
  return (
    ESTADOS_PRESTAMO_OCUPAN.includes(prestamo.estado) &&
    prestamo.fecha === fecha &&
    prestamo.horaInicio < horaLimite &&
    horaInicio < prestamo.horaLimite
  );
}

/**
 * Tablets operativas sin ningún préstamo que ocupe la franja (HU-22). No mira el estado
 * actual 'en_prestamo': una tablet prestada hoy puede estar libre otro día.
 */
export function tabletsLibresEnFranja(
  tablets: Tablet[],
  prestamos: Prestamo[],
  fecha: string,
  horaInicio: string,
  horaLimite: string,
): Tablet[] {
  return tablets.filter(
    (tablet) =>
      estaOperativa(tablet) &&
      !prestamos.some(
        (prestamo) =>
          prestamo.tabletId === tablet.id &&
          prestamoOcupaFranja(prestamo, fecha, horaInicio, horaLimite),
      ),
  );
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
