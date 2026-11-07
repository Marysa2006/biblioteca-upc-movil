/**
 * Qué hacer con la tablet que se escaneó en Inventario → Préstamos (HU-31, CA1). Función pura:
 * recibe la tablet y los préstamos, y dice qué registro abrir o por qué no hay ninguno.
 *
 * - Prestada o vencida → su devolución.
 * - Reservada para hoy (o para un día que ya pasó, como deja HU-23) → la entrega de la primera
 *   franja.
 * - Reservada solo para otro día, o sin préstamos activos → un aviso, y no se abre nada.
 */
import type { Prestamo, Tablet } from '@/types';
import { fechaLegible } from '@/utils/fechas';

export type AccionEscaneo =
  | { tipo: 'abrir'; prestamoId: string; modo: 'entrega' | 'devolucion' }
  | { tipo: 'aviso'; mensaje: string };

const porFranja = (a: Prestamo, b: Prestamo) =>
  `${a.fecha} ${a.horaInicio}`.localeCompare(`${b.fecha} ${b.horaInicio}`);

export function accionDeTablet(tablet: Tablet, prestamos: Prestamo[], hoy: string): AccionEscaneo {
  const deLaTablet = prestamos.filter((prestamo) => prestamo.tabletId === tablet.id);

  const porRecibir = deLaTablet.find(
    (prestamo) => prestamo.estado === 'entregado' || prestamo.estado === 'vencido',
  );
  if (porRecibir) return { tipo: 'abrir', prestamoId: porRecibir.id, modo: 'devolucion' };

  const reservados = deLaTablet
    .filter((prestamo) => prestamo.estado === 'reservado')
    .sort(porFranja);
  const paraHoy = reservados.find((prestamo) => prestamo.fecha <= hoy);
  if (paraHoy) return { tipo: 'abrir', prestamoId: paraHoy.id, modo: 'entrega' };

  const proximo = reservados[0];
  if (proximo) {
    return {
      tipo: 'aviso',
      mensaje: `${tablet.codigo} está reservada para el ${fechaLegible(proximo.fecha)}: se entrega ese día.`,
    };
  }
  return {
    tipo: 'aviso',
    mensaje: `${tablet.codigo} no tiene préstamos por entregar ni por recibir.`,
  };
}
