/**
 * Cómo se muestran los préstamos vencidos (HU-24). Funciones puras, sin hooks.
 * Marcar un préstamo como vencido (CA1) lo hacen los datos: aquí solo se lee estado 'vencido'.
 */
import type { Prestamo } from '@/types';
import { fechaLegible } from '@/utils/fechas';
import { inicioReserva } from '@/utils/recordatorios';

const MINUTO_MS = 60 * 1000;
const MINUTOS_DIA = 24 * 60;

/** Fecha y hora límite para devolver la tablet, en la hora del celular. */
export function limitePrestamo(prestamo: Pick<Prestamo, 'fecha' | 'horaLimite'>): Date {
  return inicioReserva({ fecha: prestamo.fecha, horaInicio: prestamo.horaLimite });
}

/**
 * Cuánto lleva vencido: "Vencido hace 25 min", "Vencido hace 1 h 20 min" o, desde un día,
 * "Vencido desde el 22 de octubre".
 */
export function textoTiempoVencido(
  prestamo: Pick<Prestamo, 'fecha' | 'horaLimite'>,
  ahora = new Date(),
): string {
  const minutos = Math.floor((ahora.getTime() - limitePrestamo(prestamo).getTime()) / MINUTO_MS);
  if (minutos < 1) return 'Vencido hace menos de 1 min';
  if (minutos < 60) return `Vencido hace ${minutos} min`;
  if (minutos < MINUTOS_DIA) {
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return resto > 0 ? `Vencido hace ${horas} h ${resto} min` : `Vencido hace ${horas} h`;
  }
  return `Vencido desde el ${fechaLegible(prestamo.fecha)}`;
}

/** "1 préstamo vencido" o "3 préstamos vencidos", para el aviso y el selector. */
export function textoCantidadVencidos(cantidad: number): string {
  return cantidad === 1 ? '1 préstamo vencido' : `${cantidad} préstamos vencidos`;
}
