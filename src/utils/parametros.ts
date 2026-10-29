/**
 * Reglas de los parámetros generales (HU-28). Funciones puras, sin hooks.
 * - CA2: validación del formulario (esquemaParametros), antes de enviar a la API.
 * - CA3: un día festivo no se ofrece para reservas ni citas (esDiaHabil, motivoNoDisponible).
 */
import { z } from 'zod';

import type { HorarioAtencion, Parametros } from '@/types';
import { esFechaValida, esHoraValida } from '@/utils/fechas';

/** ¿La fecha (ISO 'AAAA-MM-DD') es un día festivo configurado? */
export function esFestivo(fecha: string, parametros: Parametros): boolean {
  return parametros.festivos.some((festivo) => festivo.fecha === fecha);
}

/** ¿La fecha es un día hábil? No es festivo y el día tiene horario de atención. */
export function esDiaHabil(fecha: string, parametros: Parametros): boolean {
  if (esFestivo(fecha, parametros)) {
    return false;
  }
  const dia = new Date(`${fecha}T00:00:00`).getDay();
  return parametros.horarios.some((horario) => horario.dia === dia);
}

/** Por qué un día no se ofrece (CA3), o null si es hábil. */
export function motivoNoDisponible(fecha: string, parametros: Parametros): string | null {
  const festivo = parametros.festivos.find((f) => f.fecha === fecha);
  if (festivo) return `festivo (${festivo.motivo})`;
  if (!esDiaHabil(fecha, parametros)) return 'sin horario de atención';
  return null;
}

/** 0 = domingo … 6 = sábado, como HorarioAtencion.dia. */
export const NOMBRE_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/** Orden en que se muestran los días: de lunes a domingo. */
export const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0];

const HORAS_MAXIMAS = 720;
const LARGO_MAXIMO_TEXTO = 300;

// Las fechas y horas se eligen (calendario y reloj): si no son válidas, es que faltan.
const MENSAJE_FECHA = 'Elige una fecha en el calendario.';
const MENSAJE_HORA = 'Elige una hora.';

const fecha = z.string().trim().refine(esFechaValida, { error: MENSAJE_FECHA });
const horas = z
  .string()
  .trim()
  .refine((t) => /^\d+$/.test(t) && Number(t) <= HORAS_MAXIMAS, {
    error: `Escribe un número entero de horas, de 0 a ${HORAS_MAXIMAS}.`,
  });
const textoAutomatico = z
  .string()
  .trim()
  .min(1, { error: 'Escribe el texto.' })
  .max(LARGO_MAXIMO_TEXTO, { error: `Máximo ${LARGO_MAXIMO_TEXTO} caracteres.` });

/**
 * Validación del formulario (CA2). Los horarios van como los 7 días con "abierto",
 * y las horas mínimas como texto (campos numéricos).
 */
export const esquemaParametros = z
  .object({
    periodos: z.array(
      z.object({
        id: z.string(),
        nombre: z.string().trim().min(1, { error: 'Escribe el nombre del periodo.' }),
        inicio: fecha,
        fin: fecha,
      }),
    ),
    festivos: z.array(
      z.object({
        fecha,
        motivo: z.string().trim().min(1, { error: 'Escribe el motivo.' }),
      }),
    ),
    dias: z.array(
      z.object({
        dia: z.number(),
        abierto: z.boolean(),
        abre: z.string().trim(),
        cierra: z.string().trim(),
      }),
    ),
    horasMinimasSolicitud: horas,
    horasMinimasCancelacion: horas,
    textoRecordatorio: textoAutomatico,
    textoCancelacion: textoAutomatico,
  })
  .superRefine((datos, ctx) => {
    // Periodos: fechas cruzadas y periodos que se superponen.
    datos.periodos.forEach((periodo, i) => {
      if (!esFechaValida(periodo.inicio) || !esFechaValida(periodo.fin)) return;
      if (periodo.fin < periodo.inicio) {
        ctx.addIssue({
          code: 'custom',
          message: 'El fin no puede ser anterior al inicio.',
          path: ['periodos', i, 'fin'],
        });
        return;
      }
      const choca = datos.periodos.findIndex(
        (otro, j) =>
          j < i &&
          esFechaValida(otro.inicio) &&
          esFechaValida(otro.fin) &&
          periodo.inicio <= otro.fin &&
          otro.inicio <= periodo.fin,
      );
      if (choca !== -1) {
        ctx.addIssue({
          code: 'custom',
          message: `Se cruza con el periodo "${datos.periodos[choca].nombre || 'sin nombre'}".`,
          path: ['periodos', i, 'inicio'],
        });
      }
    });

    // Festivos: la misma fecha no puede estar dos veces.
    datos.festivos.forEach((festivo, i) => {
      if (datos.festivos.some((otro, j) => j < i && otro.fecha === festivo.fecha)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Esta fecha ya está como festivo.',
          path: ['festivos', i, 'fecha'],
        });
      }
    });

    // Horarios: solo los días abiertos; formato y que cierre después de abrir.
    datos.dias.forEach((dia, i) => {
      if (!dia.abierto) return;
      const abreValida = esHoraValida(dia.abre);
      const cierraValida = esHoraValida(dia.cierra);
      if (!abreValida) {
        ctx.addIssue({ code: 'custom', message: MENSAJE_HORA, path: ['dias', i, 'abre'] });
      }
      if (!cierraValida) {
        ctx.addIssue({ code: 'custom', message: MENSAJE_HORA, path: ['dias', i, 'cierra'] });
      }
      if (abreValida && cierraValida && dia.cierra <= dia.abre) {
        ctx.addIssue({
          code: 'custom',
          message: 'Debe cerrar después de abrir.',
          path: ['dias', i, 'cierra'],
        });
      }
    });
  });

export type FormularioParametros = z.input<typeof esquemaParametros>;

/** Lo guardado → valores del formulario (los 7 días, de lunes a domingo). */
export function aFormulario(parametros: Parametros): FormularioParametros {
  return {
    periodos: parametros.periodos.map((p) => ({ ...p })),
    festivos: parametros.festivos.map((f) => ({ ...f })),
    dias: ORDEN_DIAS.map((dia) => {
      const horario = parametros.horarios.find((h) => h.dia === dia);
      return {
        dia,
        abierto: horario != null,
        abre: horario?.abre ?? '08:00',
        cierra: horario?.cierra ?? '17:00',
      };
    }),
    horasMinimasSolicitud: String(parametros.horasMinimasSolicitud),
    horasMinimasCancelacion: String(parametros.horasMinimasCancelacion),
    textoRecordatorio: parametros.textoRecordatorio,
    textoCancelacion: parametros.textoCancelacion,
  };
}

/** Valores del formulario ya validados → lo que guarda la API. */
export function aParametros(datos: FormularioParametros): Parametros {
  const horarios: HorarioAtencion[] = datos.dias
    .filter((d) => d.abierto)
    .map((d) => ({ dia: d.dia, abre: d.abre.trim(), cierra: d.cierra.trim() }))
    .sort((a, b) => a.dia - b.dia);
  return {
    periodos: datos.periodos.map((p) => ({
      id: p.id,
      nombre: p.nombre.trim(),
      inicio: p.inicio.trim(),
      fin: p.fin.trim(),
    })),
    festivos: datos.festivos
      .map((f) => ({ fecha: f.fecha.trim(), motivo: f.motivo.trim() }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    horarios,
    horasMinimasSolicitud: Number(datos.horasMinimasSolicitud),
    horasMinimasCancelacion: Number(datos.horasMinimasCancelacion),
    textoRecordatorio: datos.textoRecordatorio.trim(),
    textoCancelacion: datos.textoCancelacion.trim(),
  };
}
