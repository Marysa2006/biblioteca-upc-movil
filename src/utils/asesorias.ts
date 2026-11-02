/**
 * Reglas de las citas de asesoría (HU-14). Funciones puras, sin hooks ni API: las usan los
 * componentes de src/components/asesorias y el mock puede usar las mismas para no repetirlas.
 *
 * El plazo para cancelar sale de parametros.horasMinimasCancelacion (HU-28). Reprogramar
 * libera la franja de antes, así que sigue el mismo plazo que cancelar.
 */
import { z } from 'zod';

import type { Cita, EstadoSolicitud, FranjaAsesoria, TemaAsesoria } from '@/types';
import { inicioReserva } from '@/utils/recordatorios';

const HORA_MS = 60 * 60 * 1000;

/** Una cita solo se cancela o reprograma mientras siga en curso. */
const ESTADOS_CANCELABLES: EstadoSolicitud[] = ['pendiente', 'aprobada'];

/**
 * Temas que se ofrecen a la comunidad. useTemas() (HU-13) trae también los inactivos, porque
 * sirve a la administración.
 */
export function temasActivos(temas: TemaAsesoria[]): TemaAsesoria[] {
  return temas.filter((tema) => tema.activo);
}

export type DiaFranjas = { fecha: string; franjas: FranjaAsesoria[] };

/** Agrupa las franjas por día, en orden de fecha y hora, sin las que ya no tienen cupo. */
export function agruparFranjasPorDia(franjas: FranjaAsesoria[]): DiaFranjas[] {
  const ordenadas = franjas
    .filter((f) => f.cuposLibres > 0)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio));

  const dias: DiaFranjas[] = [];
  for (const franja of ordenadas) {
    const ultimo = dias[dias.length - 1];
    if (ultimo?.fecha === franja.fecha) ultimo.franjas.push(franja);
    else dias.push({ fecha: franja.fecha, franjas: [franja] });
  }
  return dias;
}

export function textoCupos(cupos: number): string {
  return cupos === 1 ? '1 cupo libre' : `${cupos} cupos libres`;
}

/** Si la cita sigue en curso (pendiente o aprobada), sin mirar el plazo. */
export function citaEnCurso(cita: Pick<Cita, 'estado'>): boolean {
  return ESTADOS_CANCELABLES.includes(cita.estado);
}

/** Si la cita todavía se puede cancelar o reprogramar (HU-14, CA3). La API vuelve a validar. */
export function puedeCancelarCita(
  cita: Pick<Cita, 'estado' | 'fecha' | 'horaInicio'>,
  horasCancelacion: number,
  ahora: Date = new Date(),
): boolean {
  if (!citaEnCurso(cita)) return false;
  return inicioReserva(cita).getTime() - ahora.getTime() >= horasCancelacion * HORA_MS;
}

export function textoPlazoCancelacion(horas: number): string {
  const plazo = horas === 1 ? '1 hora' : `${horas} horas`;
  return `Las citas se pueden cancelar o reprogramar hasta ${plazo} antes.`;
}

const LARGO_MINIMO_NECESIDAD = 10;
const LARGO_MAXIMO_NECESIDAD = 300;

/** Lo que la persona necesita de la asesoría (HU-14, CA1). */
export const esquemaCita = z.object({
  necesidad: z
    .string()
    .trim()
    .min(LARGO_MINIMO_NECESIDAD, {
      error: `Cuéntanos qué necesitas, con al menos ${LARGO_MINIMO_NECESIDAD} caracteres.`,
    })
    .max(LARGO_MAXIMO_NECESIDAD, { error: `Máximo ${LARGO_MAXIMO_NECESIDAD} caracteres.` }),
});

export type FormularioCita = z.input<typeof esquemaCita>;
