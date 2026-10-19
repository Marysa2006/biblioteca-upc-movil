/**
 * Calendario de la disponibilidad de espacios (HU-17), sin paquetes de calendario.
 * Fechas como texto 'AAAA-MM-DD' en la hora del celular. Funciones puras.
 * La semana va de lunes a domingo, como los horarios de los parámetros (ORDEN_DIAS).
 */
import type { DiaDisponibilidad } from '@/types';
import { fechaLegible, MESES } from '@/utils/fechas';
import { NOMBRE_DIA } from '@/utils/parametros';

const dos = (n: number) => String(n).padStart(2, '0');

function aFecha(texto: string): Date {
  const [anio, mes, dia] = texto.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

function aTexto(fecha: Date): string {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/** 0 = lunes … 6 = domingo. */
const posicionEnSemana = (fecha: string) => (aFecha(fecha).getDay() + 6) % 7;

export function sumarDias(fecha: string, dias: number): string {
  const resultado = aFecha(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return aTexto(resultado);
}

/** Primer día del mes que está `meses` antes o después del de la fecha. */
export function sumarMeses(fecha: string, meses: number): string {
  const base = aFecha(fecha);
  return aTexto(new Date(base.getFullYear(), base.getMonth() + meses, 1));
}

export const inicioMes = (fecha: string) => sumarMeses(fecha, 0);
export const finMes = (fecha: string) => sumarDias(sumarMeses(fecha, 1), -1);
export const mismoMes = (a: string, b: string) => a.slice(0, 7) === b.slice(0, 7);

/** Lunes de la semana de la fecha. */
export function inicioSemana(fecha: string): string {
  return sumarDias(fecha, -posicionEnSemana(fecha));
}

/** Los 7 días de la semana de la fecha, de lunes a domingo. */
export function diasSemana(fecha: string): string[] {
  const lunes = inicioSemana(fecha);
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

export type Rango = { desde: string; hasta: string };

/** Rango para pedir la disponibilidad de una semana. */
export function rangoSemana(fecha: string): Rango {
  const lunes = inicioSemana(fecha);
  return { desde: lunes, hasta: sumarDias(lunes, 6) };
}

/** Rango para pedir la disponibilidad de un mes. */
export function rangoMes(fecha: string): Rango {
  return { desde: inicioMes(fecha), hasta: finMes(fecha) };
}

/** Semanas del mes en filas de 7 (lunes a domingo); null en los huecos antes y después. */
export function grillaMes(fecha: string): (string | null)[][] {
  const { desde, hasta } = rangoMes(fecha);
  const celdas: (string | null)[] = Array(posicionEnSemana(desde)).fill(null);
  // Las fechas ISO se comparan bien como texto.
  for (let dia = desde; dia <= hasta; dia = sumarDias(dia, 1)) {
    celdas.push(dia);
  }
  while (celdas.length % 7 !== 0) {
    celdas.push(null);
  }
  return Array.from({ length: celdas.length / 7 }, (_, i) => celdas.slice(i * 7, i * 7 + 7));
}

/** 2026-10-20 → "Martes". */
export const nombreDia = (fecha: string) => NOMBRE_DIA[aFecha(fecha).getDay()];
/** 2026-10-21 → "Mié". */
export const abreviaturaDia = (fecha: string) => nombreDia(fecha).slice(0, 3);
/** 2026-10-05 → 5. */
export const numeroDia = (fecha: string) => Number(fecha.slice(8, 10));
/** 2026-10-20 → "Martes 20 de octubre". */
export const fechaCompleta = (fecha: string) => `${nombreDia(fecha)} ${fechaLegible(fecha)}`;

/** "19 al 25 de octubre", o "26 de octubre al 1 de noviembre" si cruza de mes. */
export function tituloSemana(fecha: string): string {
  const { desde, hasta } = rangoSemana(fecha);
  if (mismoMes(desde, hasta)) {
    return `${numeroDia(desde)} al ${fechaLegible(hasta)}`;
  }
  return `${fechaLegible(desde)} al ${fechaLegible(hasta)}`;
}

/** "Octubre de 2026". */
export function tituloMes(fecha: string): string {
  const [anio, mes] = fecha.split('-').map(Number);
  const nombre = MESES[mes - 1];
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} de ${anio}`;
}

export type TipoResumen = 'con_libres' | 'completo' | 'no_habil';

/** Resumen de un día para la tira de la semana y la grilla del mes. */
export function resumenDia(dia: DiaDisponibilidad): { tipo: TipoResumen; texto: string } {
  if (!dia.habil) {
    return { tipo: 'no_habil', texto: dia.motivo ? `No disponible: ${dia.motivo}` : 'No disponible' };
  }
  const libres = dia.franjas.filter((franja) => franja.estado === 'disponible').length;
  if (libres === 0) {
    return { tipo: 'completo', texto: 'Sin franjas libres' };
  }
  return { tipo: 'con_libres', texto: libres === 1 ? '1 franja libre' : `${libres} franjas libres` };
}
