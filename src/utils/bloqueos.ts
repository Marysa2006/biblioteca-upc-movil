/**
 * Formulario de bloqueo de espacios (HU-20): por franja, día o rango, con su validación.
 * Funciones puras, sin hooks.
 */
import { z } from 'zod';

import type { Bloqueo } from '@/types';
import { esFechaValida, esHoraValida, fechaLegible, hoyISO } from '@/utils/fechas';

/** Cómo se bloquea: unas horas de un día, un día completo o varios días completos. */
export type ModoBloqueo = 'franja' | 'dia' | 'rango';

export const MODOS_BLOQUEO: { valor: ModoBloqueo; etiqueta: string; icono: string }[] = [
  { valor: 'franja', etiqueta: 'Franja', icono: 'clock-outline' },
  { valor: 'dia', etiqueta: 'Día', icono: 'calendar-today' },
  { valor: 'rango', etiqueta: 'Rango', icono: 'calendar-range' },
];

const MENSAJE_FECHA = 'Escribe una fecha real en formato AAAA-MM-DD.';
const MENSAJE_HORA = 'Escribe una hora en formato HH:MM, de 00:00 a 23:59.';

/**
 * Validación del formulario (HU-20). Todos los campos son texto; según el modo solo se
 * validan los que se ven. No se bloquean fechas pasadas.
 */
export const esquemaBloqueo = z
  .object({
    modo: z.enum(['franja', 'dia', 'rango']),
    /** Día del bloqueo en los modos franja y día. */
    fecha: z.string().trim(),
    /** Primer y último día en el modo rango. */
    desde: z.string().trim(),
    hasta: z.string().trim(),
    horaInicio: z.string().trim(),
    horaFin: z.string().trim(),
    motivo: z
      .string()
      .trim()
      .min(1, { error: 'Escribe el motivo del bloqueo.' })
      .max(200, { error: 'Máximo 200 caracteres.' }),
  })
  .superRefine((datos, ctx) => {
    const hoy = hoyISO();
    const revisarFecha = (campo: 'fecha' | 'desde' | 'hasta') => {
      const valor = datos[campo];
      if (!esFechaValida(valor)) {
        ctx.addIssue({ code: 'custom', message: MENSAJE_FECHA, path: [campo] });
        return false;
      }
      if (valor < hoy) {
        ctx.addIssue({ code: 'custom', message: 'No se puede bloquear una fecha pasada.', path: [campo] });
        return false;
      }
      return true;
    };

    if (datos.modo === 'rango') {
      const desdeValida = revisarFecha('desde');
      const hastaValida = revisarFecha('hasta');
      if (desdeValida && hastaValida && datos.hasta < datos.desde) {
        ctx.addIssue({
          code: 'custom',
          message: 'La fecha final no puede ser anterior a la inicial.',
          path: ['hasta'],
        });
      }
      return;
    }

    revisarFecha('fecha');
    if (datos.modo === 'franja') {
      const inicioValida = esHoraValida(datos.horaInicio);
      const finValida = esHoraValida(datos.horaFin);
      if (!inicioValida) {
        ctx.addIssue({ code: 'custom', message: MENSAJE_HORA, path: ['horaInicio'] });
      }
      if (!finValida) {
        ctx.addIssue({ code: 'custom', message: MENSAJE_HORA, path: ['horaFin'] });
      }
      if (inicioValida && finValida && datos.horaFin <= datos.horaInicio) {
        ctx.addIssue({
          code: 'custom',
          message: 'La hora de fin debe ser posterior a la de inicio.',
          path: ['horaFin'],
        });
      }
    }
  });

export type DatosFormularioBloqueo = z.infer<typeof esquemaBloqueo>;

/** Del formulario al Bloqueo que reciben los hooks (sin id). */
export function aDatosBloqueo(espacioId: string, datos: DatosFormularioBloqueo): Omit<Bloqueo, 'id'> {
  const motivo = datos.motivo.trim();
  if (datos.modo === 'rango') {
    return { espacioId, desde: datos.desde, hasta: datos.hasta, motivo };
  }
  if (datos.modo === 'dia') {
    return { espacioId, desde: datos.fecha, hasta: datos.fecha, motivo };
  }
  return {
    espacioId,
    desde: datos.fecha,
    hasta: datos.fecha,
    horaInicio: datos.horaInicio,
    horaFin: datos.horaFin,
    motivo,
  };
}

/** "27 de octubre, 08:00 a 12:00", "27 de octubre, todo el día" o "del 27 al 29 de octubre, todo el día". */
export function periodoLegible(bloqueo: Pick<Bloqueo, 'desde' | 'hasta' | 'horaInicio' | 'horaFin'>): string {
  const dias =
    bloqueo.desde === bloqueo.hasta
      ? fechaLegible(bloqueo.desde)
      : `del ${fechaLegible(bloqueo.desde)} al ${fechaLegible(bloqueo.hasta)}`;
  const horas =
    bloqueo.horaInicio && bloqueo.horaFin
      ? `${bloqueo.horaInicio} a ${bloqueo.horaFin}`
      : 'todo el día';
  return `${dias}, ${horas}`;
}
