/**
 * Fechas de los DATOS DE PRUEBA, relativas al día en que se abre la app. Así la demostración se
 * ve al día cualquier día que se muestre: lo pendiente queda en los próximos días hábiles y lo
 * realizado, cancelado o vencido, en días pasados.
 *
 * Los días hábiles salen de los parámetros de prueba (horarios y festivos, HU-28), con
 * esDiaHabil(). Se calculan una vez, al cargar la app.
 */
import { sumarDias } from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';
import { esDiaHabil } from '@/utils/parametros';

import { PARAMETROS } from './parametros';

/** Hoy, 'AAAA-MM-DD', en la hora del celular. */
export const HOY = hoyISO();

/** Para no buscar sin fin si los parámetros no tuvieran ningún día con atención. */
const MAXIMO_DIAS = 400;

const habilEn = (fecha: string) => esDiaHabil(fecha, PARAMETROS);

/**
 * El día hábil número `n` contando desde hoy: 1 es el próximo, -1 el anterior. Con 0, hoy si es
 * hábil o, si no, el próximo.
 */
export function habil(n: number): string {
  const paso = n < 0 ? -1 : 1;
  let fecha = HOY;
  let faltan = Math.abs(n);
  if (n === 0) {
    for (let i = 0; i < MAXIMO_DIAS && !habilEn(fecha); i += 1) fecha = sumarDias(fecha, 1);
    return fecha;
  }
  for (let i = 0; i < MAXIMO_DIAS && faltan > 0; i += 1) {
    fecha = sumarDias(fecha, paso);
    if (habilEn(fecha)) faltan -= 1;
  }
  return fecha;
}

/**
 * La vez número `n` que cae un día de la semana hábil, sin contar hoy: con `dias` = [1, 3]
 * (lunes y miércoles), 1 es el próximo lunes o miércoles con atención y -1 el anterior.
 * 0 = domingo … 6 = sábado, como en las jornadas.
 */
export function proximo(dias: readonly number[], n: number): string {
  const paso = n < 0 ? -1 : 1;
  let fecha = HOY;
  let faltan = Math.abs(n);
  for (let i = 0; i < MAXIMO_DIAS && faltan > 0; i += 1) {
    fecha = sumarDias(fecha, paso);
    const dia = new Date(`${fecha}T00:00:00`).getDay();
    if (dias.includes(dia) && habilEn(fecha)) faltan -= 1;
  }
  return fecha;
}

/** Fecha y hora como las guardan el historial y las notificaciones: 'AAAA-MM-DD HH:MM'. */
export const conHora = (fecha: string, hora: string) => `${fecha} ${hora}`;
