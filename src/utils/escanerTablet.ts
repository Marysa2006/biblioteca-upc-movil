/**
 * Qué hacer con la tablet que se escaneó en Gestión → Préstamos (HU-31, CA1). Función pura:
 * recibe la tablet, el inventario y los préstamos, y dice qué abrir o por qué no hay nada.
 *
 * - Prestada o vencida → su devolución.
 * - Libre → los préstamos por entregar (de hoy o atrasados) en los que cabe, para elegir a quién
 *   se entrega (#310: la tablet se asigna al entregarla). Cabe si `asignarTabletAlEntregar()`
 *   la acepta, la misma regla de la pantalla de entrega y de la API.
 * - Cualquier otro caso → un aviso que dice por qué.
 */
import type { Prestamo, Tablet } from '@/types';
import { asignarTabletAlEntregar } from '@/utils/tablets';

export type AccionEscaneo =
  | { tipo: 'abrir'; prestamoId: string; modo: 'devolucion' }
  | { tipo: 'elegir'; tablet: Tablet; prestamos: Prestamo[] }
  | { tipo: 'aviso'; mensaje: string };

const ESTADO_NO_DISPONIBLE: Partial<Record<Tablet['estado'], string>> = {
  mantenimiento: 'está en mantenimiento',
  de_baja: 'está de baja',
  en_prestamo: 'figura como prestada, pero no tiene un préstamo activo',
};

export function accionDeTablet(
  tablet: Tablet,
  prestamos: Prestamo[],
  tablets: Tablet[],
  hoy: string,
): AccionEscaneo {
  const porRecibir = prestamos.find(
    (prestamo) =>
      prestamo.tabletId === tablet.id &&
      (prestamo.estado === 'entregado' || prestamo.estado === 'vencido'),
  );
  if (porRecibir) return { tipo: 'abrir', prestamoId: porRecibir.id, modo: 'devolucion' };

  if (tablet.estado !== 'disponible') {
    return {
      tipo: 'aviso',
      mensaje: `${tablet.codigo} ${ESTADO_NO_DISPONIBLE[tablet.estado] ?? 'no está disponible'}: no se puede entregar. Revísala en Inventario.`,
    };
  }

  const candidatos = prestamos
    .filter(
      (prestamo) =>
        prestamo.estado === 'reservado' &&
        prestamo.fecha <= hoy &&
        'tablet' in asignarTabletAlEntregar(tablets, prestamos, prestamo, tablet.id),
    )
    .sort((a, b) => `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`));
  if (candidatos.length > 0) return { tipo: 'elegir', tablet, prestamos: candidatos };

  return {
    tipo: 'aviso',
    mensaje: `${tablet.codigo} está libre, pero hoy no hay préstamos por entregar en los que quepa.`,
  };
}
