/**
 * Formulario de bloqueo de espacios (HU-20): por franja, día o rango, con su validación.
 * Funciones puras, sin hooks.
 *
 * Las reglas de fecha y hora que comparten las reservas (HU-18 y HU-19) se reutilizan de
 * src/utils/reservas.ts (problemaFecha, problemaHorario) y de los parámetros de HU-28; aquí
 * van solo las propias del bloqueo: horario de atención, rango, horizonte y cruces.
 */
import { z } from 'zod';

import type { Bloqueo, Parametros } from '@/types';
import { fechaCompleta, sumarDias } from '@/utils/calendario';
import { esFechaValida, esHoraValida, fechaLegible } from '@/utils/fechas';
import { motivoNoDisponible } from '@/utils/parametros';
import { problemaFecha, problemaHorario } from '@/utils/reservas';

/** Cómo se bloquea: unas horas de un día, un día completo o varios días completos. */
export type ModoBloqueo = 'franja' | 'dia' | 'rango';

export const MODOS_BLOQUEO: { valor: ModoBloqueo; etiqueta: string; icono: string }[] = [
  { valor: 'franja', etiqueta: 'Franja', icono: 'clock-outline' },
  { valor: 'dia', etiqueta: 'Día', icono: 'calendar-today' },
  { valor: 'rango', etiqueta: 'Rango', icono: 'calendar-range' },
];

/** Un rango largo casi siempre es un error de digitación (un mes o un año de más). */
export const DIAS_MAXIMOS_RANGO = 31;
/** Hasta dónde se puede bloquear por adelantado. */
export const DIAS_MAXIMOS_ANTICIPACION = 365;

const MENSAJE_FECHA = 'Escribe una fecha real en formato AAAA-MM-DD.';
const MENSAJE_HORA = 'Escribe una hora en formato HH:MM, de 00:00 a 23:59.';

// ── Formato mientras se escribe ───────────────────────────────────────────────────────

/** Deja solo dígitos y pone los guiones: "20261026" → "2026-10-26". */
export function formatearFecha(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 4) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 4)}-${digitos.slice(4)}`;
  return `${digitos.slice(0, 4)}-${digitos.slice(4, 6)}-${digitos.slice(6)}`;
}

/** Deja solo dígitos y pone los dos puntos: "1400" → "14:00". */
export function formatearHora(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 4);
  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}:${digitos.slice(2)}`;
}

// ── Ayudas para mostrar ───────────────────────────────────────────────────────────────

/** Horario de atención del día de la fecha (HU-28), o undefined si ese día no se atiende. */
function horarioDelDia(fecha: string, parametros: Parametros) {
  const dia = new Date(`${fecha}T00:00:00`).getDay();
  return parametros.horarios.find((horario) => horario.dia === dia);
}

/**
 * "Lunes 26 de octubre · atención 07:00 a 18:00" o "Lunes 2 de noviembre · festivo (…)",
 * para ver de un vistazo qué día se eligió. Vacío si la fecha aún no es válida.
 */
export function descripcionFecha(fecha: string, parametros: Parametros): string {
  if (!esFechaValida(fecha)) return '';
  const motivo = motivoNoDisponible(fecha, parametros);
  const horario = horarioDelDia(fecha, parametros);
  const detalle = motivo ?? (horario ? `atención ${horario.abre} a ${horario.cierra}` : '');
  return `${fechaCompleta(fecha)} · ${detalle}`;
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

// ── Validación ────────────────────────────────────────────────────────────────────────

const camposFormulario = z.object({
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
    .min(5, { error: 'Escribe el motivo del bloqueo (al menos 5 caracteres).' })
    .max(200, { error: 'Máximo 200 caracteres.' }),
});

export type DatosFormularioBloqueo = z.infer<typeof camposFormulario>;

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

/** ¿Se cruzan dos bloqueos del mismo espacio? Sin franja = todo el día. */
function seCruzan(a: Omit<Bloqueo, 'id'>, b: Omit<Bloqueo, 'id'>): boolean {
  if (a.desde > b.hasta || b.desde > a.hasta) return false;
  if (!a.horaInicio || !a.horaFin || !b.horaInicio || !b.horaFin) return true;
  return a.horaInicio < b.horaFin && b.horaInicio < a.horaFin;
}

type Contexto = {
  parametros: Parametros;
  /** Bloqueos que ya tiene el espacio, para no cruzarlos. */
  bloqueos: Bloqueo[];
  /** Fecha 'AAAA-MM-DD' y hora 'HH:MM' de ahora, en el celular. */
  hoy: string;
  ahora: string;
};

/**
 * Validación del formulario (HU-20) con los parámetros de la biblioteca y los bloqueos del
 * espacio. Según el modo solo se validan los campos que se ven.
 */
export function crearEsquemaBloqueo({ parametros, bloqueos, hoy, ahora }: Contexto) {
  const limite = sumarDias(hoy, DIAS_MAXIMOS_ANTICIPACION);

  return camposFormulario.superRefine((datos, ctx) => {
    const error = (campo: keyof DatosFormularioBloqueo, message: string) =>
      ctx.addIssue({ code: 'custom', message, path: [campo] });

    /** Formato, no pasada y dentro del horizonte. true si la fecha sirve para seguir. */
    const fechaUtil = (campo: 'fecha' | 'desde' | 'hasta') => {
      const valor = datos[campo];
      if (!esFechaValida(valor)) {
        error(campo, MENSAJE_FECHA);
        return false;
      }
      if (valor < hoy) {
        error(campo, 'La fecha ya pasó.');
        return false;
      }
      if (valor > limite) {
        error(campo, `Solo se puede bloquear hasta un año adelante (${fechaLegible(limite)} de ${limite.slice(0, 4)}).`);
        return false;
      }
      return true;
    };

    if (datos.modo === 'rango') {
      const desdeUtil = fechaUtil('desde');
      const hastaUtil = fechaUtil('hasta');
      if (!desdeUtil || !hastaUtil) return;

      if (datos.hasta < datos.desde) {
        error('hasta', 'La fecha final no puede ser anterior a la inicial.');
        return;
      }
      if (datos.hasta === datos.desde) {
        error('hasta', 'Para un solo día usa el tipo "Día".');
        return;
      }
      const dias: string[] = [];
      for (let dia = datos.desde; dia <= datos.hasta; dia = sumarDias(dia, 1)) {
        dias.push(dia);
        if (dias.length > DIAS_MAXIMOS_RANGO) break;
      }
      if (dias.length > DIAS_MAXIMOS_RANGO) {
        error('hasta', `El rango puede tener máximo ${DIAS_MAXIMOS_RANGO} días.`);
        return;
      }
      if (dias.every((dia) => problemaFecha(dia, parametros, hoy) !== null)) {
        error('hasta', 'El rango no tiene días hábiles: todos son festivos o sin atención.');
        return;
      }
    } else {
      if (!fechaUtil('fecha')) return;
      const problemaDia = problemaFecha(datos.fecha, parametros, hoy);
      if (problemaDia) {
        error('fecha', problemaDia);
        return;
      }

      if (datos.modo === 'franja') {
        if (!esHoraValida(datos.horaInicio)) error('horaInicio', MENSAJE_HORA);
        if (!esHoraValida(datos.horaFin)) error('horaFin', MENSAJE_HORA);
        if (!esHoraValida(datos.horaInicio) || !esHoraValida(datos.horaFin)) return;

        const problema = problemaHorario(datos.horaInicio, datos.horaFin);
        if (problema) {
          error(problema.campo, problema.mensaje);
          return;
        }
        const horario = horarioDelDia(datos.fecha, parametros);
        if (horario && datos.horaInicio < horario.abre) {
          error('horaInicio', `La biblioteca abre a las ${horario.abre} ese día.`);
          return;
        }
        if (horario && datos.horaFin > horario.cierra) {
          error('horaFin', `La biblioteca cierra a las ${horario.cierra} ese día.`);
          return;
        }
        if (datos.fecha === hoy && datos.horaInicio <= ahora) {
          error('horaInicio', 'Esa hora ya pasó hoy. Elige una hora posterior.');
          return;
        }
      }
    }

    // Sin choques con los bloqueos que ya tiene el espacio (todos son de este espacio).
    const nuevo = aDatosBloqueo('', datos);
    const cruce = bloqueos.find((existente) => seCruzan(nuevo, existente));
    if (cruce) {
      const campo = datos.modo === 'rango' ? 'desde' : datos.modo === 'franja' ? 'horaInicio' : 'fecha';
      error(campo, `Se cruza con un bloqueo existente: ${periodoLegible(cruce)} (${cruce.motivo}).`);
    }
  });
}
