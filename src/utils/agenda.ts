/**
 * Reglas de la agenda del facilitador (HU-15). Funciones puras, sin hooks.
 * - La agenda muestra las citas que se atienden: pendientes, aprobadas y realizadas (CA1).
 * - El resultado o la inasistencia se registran cuando la cita aprobada ya terminó (CA3).
 */
import { z } from 'zod';

import type { Cita, EstadoSolicitud } from '@/types';
import { diasSemana, mismoMes, numeroDia, sumarDias } from '@/utils/calendario';
import { fechaLegible } from '@/utils/fechas';
import { inicioReserva } from '@/utils/recordatorios';

/** Estados que aparecen en la agenda; las rechazadas y canceladas no se atienden. */
export const ESTADOS_AGENDA: EstadoSolicitud[] = ['pendiente', 'aprobada', 'realizada'];

const porFechaYHora = (a: Cita, b: Cita) =>
  a.fecha === b.fecha ? a.horaInicio.localeCompare(b.horaInicio) : a.fecha.localeCompare(b.fecha);

/** Las citas de la agenda, de la más próxima a la más lejana. */
export function citasAsignadas(citas: Cita[]): Cita[] {
  return citas.filter((cita) => ESTADOS_AGENDA.includes(cita.estado)).sort(porFechaYHora);
}

/** Las citas de un día, ordenadas por hora (vista del día). */
export function citasDelDia(citas: Cita[], fecha: string): Cita[] {
  return citasAsignadas(citas).filter((cita) => cita.fecha === fecha);
}

export type DiaCitas = { fecha: string; citas: Cita[] };

/** Las citas agrupadas por día, en orden (vista de la semana). Los días sin citas no aparecen. */
export function agruparCitasPorDia(citas: Cita[]): DiaCitas[] {
  const dias: DiaCitas[] = [];
  for (const cita of citasAsignadas(citas)) {
    const ultimo = dias[dias.length - 1];
    if (ultimo && ultimo.fecha === cita.fecha) ultimo.citas.push(cita);
    else dias.push({ fecha: cita.fecha, citas: [cita] });
  }
  return dias;
}

/** Los días que muestra la agenda en Día y Semana: de lunes a sábado (los domingos no hay citas). */
export function diasAgenda(fecha: string): string[] {
  return diasSemana(fecha).slice(0, 6);
}

/** El domingo pasa al lunes siguiente, para que la vista Día no quede en un domingo. */
export function diaDeAgenda(fecha: string): string {
  return diasSemana(fecha)[6] === fecha ? sumarDias(fecha, 1) : fecha;
}

/** Un día antes o después en la vista Día, saltando el domingo. */
export function moverDiaAgenda(fecha: string, paso: 1 | -1): string {
  const siguiente = sumarDias(fecha, paso);
  return diasSemana(siguiente)[6] === siguiente ? sumarDias(siguiente, paso) : siguiente;
}

/** "26 al 31 de octubre", o "28 de septiembre al 3 de octubre" si cruza de mes (sin el domingo). */
export function tituloSemanaAgenda(fecha: string): string {
  const dias = diasAgenda(fecha);
  const desde = dias[0];
  const hasta = dias[dias.length - 1];
  if (mismoMes(desde, hasta)) return `${numeroDia(desde)} al ${fechaLegible(hasta)}`;
  return `${fechaLegible(desde)} al ${fechaLegible(hasta)}`;
}

/** Cuántas citas de la agenda tiene cada día, para la tira de días y el mes. */
export function contarCitasPorDia(citas: Cita[]): Map<string, number> {
  const conteo = new Map<string, number>();
  for (const cita of citasAsignadas(citas)) {
    conteo.set(cita.fecha, (conteo.get(cita.fecha) ?? 0) + 1);
  }
  return conteo;
}

/** "1 cita" o "3 citas". */
export const textoCitas = (cantidad: number) => (cantidad === 1 ? '1 cita' : `${cantidad} citas`);

/** Ya pasó la hora de fin de la cita, en la hora del celular. */
export function citaTerminada(cita: Cita, ahora = new Date()): boolean {
  return inicioReserva({ fecha: cita.fecha, horaInicio: cita.horaFin }) <= ahora;
}

/** Ya se registró el resultado o la inasistencia. */
export const citaAtendida = (cita: Cita) => cita.resultado != null || cita.asistio === false;

/** CA3: la cita aprobada que ya terminó y todavía no tiene resultado ni inasistencia. */
export function puedeRegistrarResultado(cita: Cita, ahora = new Date()): boolean {
  return cita.estado === 'aprobada' && citaTerminada(cita, ahora) && !citaAtendida(cita);
}

const LARGO_MINIMO_RESULTADO = 10;
const LARGO_MAXIMO_RESULTADO = 500;

/** CA3: el resultado o la nota de la asesoría. */
export const esquemaResultado = z.object({
  resultado: z
    .string()
    .trim()
    .min(LARGO_MINIMO_RESULTADO, {
      error: `Cuenta en al menos ${LARGO_MINIMO_RESULTADO} caracteres cómo fue la asesoría.`,
    })
    .max(LARGO_MAXIMO_RESULTADO, { error: `Máximo ${LARGO_MAXIMO_RESULTADO} caracteres.` }),
});

/** Se llama Datos y no Formulario: FormularioResultado es el componente. */
export type DatosResultado = z.input<typeof esquemaResultado>;
