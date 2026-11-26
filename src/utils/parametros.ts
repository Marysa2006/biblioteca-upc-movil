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

/** Días que se recorren para sugerir otra fecha (HU-10, CA3). */
const DIAS_BUSQUEDA_SUGERENCIA = 14;
const HORA_MS = 60 * 60 * 1000;

/**
 * La fecha 'AAAA-MM-DD' `dias` después (o antes). Local: utils/calendario importa de este
 * archivo, así que usar su sumarDias aquí haría un ciclo de imports.
 */
function sumarDiasFecha(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const resultado = new Date(anio, mes - 1, dia + dias);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${resultado.getFullYear()}-${dos(resultado.getMonth() + 1)}-${dos(resultado.getDate())}`;
}

/**
 * La primera fecha desde `desde` (incluida) que es hábil y cumple la anticipación mínima
 * (horasMinimasSolicitud) a la hora pedida, buscando hasta 14 días; si no hay, undefined.
 * Así la sugerencia siempre se puede aceptar tal cual (HU-10, CA3).
 */
export function sugerirFechaHabil(
  desde: string,
  hora: string,
  parametros: Parametros,
  ahora = Date.now(),
): string | undefined {
  const minimo = ahora + parametros.horasMinimasSolicitud * HORA_MS;
  for (let i = 0; i <= DIAS_BUSQUEDA_SUGERENCIA; i += 1) {
    const dia = sumarDiasFecha(desde, i);
    if (esDiaHabil(dia, parametros) && new Date(`${dia}T${hora}:00`).getTime() >= minimo) {
      return dia;
    }
  }
  return undefined;
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
        franjas: z.array(z.object({ abre: z.string().trim(), cierra: z.string().trim() })),
      }),
    ),
    horasMinimasSolicitud: horas,
    horasMinimasCancelacion: horas,
    textoRecordatorio: textoAutomatico,
    textoCancelacion: textoAutomatico,
    /** Horas máximas de un préstamo de tablet (versión 1.1). */
    horasMaximasPrestamo: horas,
    // Los parámetros del Backend (#278) van en el formulario aunque la pantalla todavía no los
    // muestre: así, al guardar desde Parámetros, no se pierden ni vuelven al valor por defecto.
    horasPrestamoTablet: horas,
    diasMaximosTablet: horas,
    minutosRecogerTablet: horas,
    duracionAsesoriaMinutos: horas.or(z.literal('')),
    maximoPersonasAsesoria: horas.or(z.literal('')),
    horasVigenciaQr: horas.or(z.literal('')),
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

    datos.dias.forEach(({ franjas }, i) => {
      franjas.forEach(({ abre, cierra }, j) => {
        const error = (campo: 'abre' | 'cierra', message: string) =>
          ctx.addIssue({ code: 'custom', message, path: ['dias', i, 'franjas', j, campo] });
        if (!esHoraValida(abre)) error('abre', MENSAJE_HORA);
        else if (!esHoraValida(cierra)) error('cierra', MENSAJE_HORA);
        else if (cierra <= abre) error('cierra', 'Debe cerrar después de abrir.');
        else if (franjas.slice(0, j).some((otra) => abre < otra.cierra && otra.abre < cierra)) {
          error('abre', 'Esta franja se cruza con otra del mismo día.');
        }
      });
    });
  });

export type FormularioParametros = z.input<typeof esquemaParametros>;

/** Lo guardado → valores del formulario (los 7 días, de lunes a domingo). */
export function aFormulario(parametros: Parametros): FormularioParametros {
  return {
    periodos: parametros.periodos.map((p) => ({ ...p })),
    festivos: parametros.festivos.map((f) => ({ ...f })),
    dias: ORDEN_DIAS.map((dia) => ({
      dia,
      franjas: parametros.horarios.filter((h) => h.dia === dia).map(({ abre, cierra }) => ({ abre, cierra })),
    })),
    horasMinimasSolicitud: String(parametros.horasMinimasSolicitud),
    horasMinimasCancelacion: String(parametros.horasMinimasCancelacion),
    textoRecordatorio: parametros.textoRecordatorio,
    textoCancelacion: parametros.textoCancelacion,
    horasMaximasPrestamo: String(parametros.horasMaximasPrestamo),
    horasPrestamoTablet: String(parametros.horasPrestamoTablet),
    diasMaximosTablet: String(parametros.diasMaximosTablet),
    minutosRecogerTablet: String(parametros.minutosRecogerTablet),
    duracionAsesoriaMinutos: String(parametros.duracionAsesoriaMinutos ?? ''),
    maximoPersonasAsesoria: String(parametros.maximoPersonasAsesoria ?? ''),
    horasVigenciaQr: String(parametros.horasVigenciaQr ?? ''),
  };
}

/** Valores del formulario ya validados → lo que guarda la API. */
export function aParametros(datos: FormularioParametros): Parametros {
  const horarios: HorarioAtencion[] = datos.dias
    .flatMap(({ dia, franjas }) => franjas.map(({ abre, cierra }) => ({ dia, abre: abre.trim(), cierra: cierra.trim() })))
    .sort((a, b) => a.dia - b.dia || a.abre.localeCompare(b.abre));
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
    horasMaximasPrestamo: Number(datos.horasMaximasPrestamo),
    horasPrestamoTablet: Number(datos.horasPrestamoTablet),
    diasMaximosTablet: Number(datos.diasMaximosTablet),
    minutosRecogerTablet: Number(datos.minutosRecogerTablet),
    duracionAsesoriaMinutos: datos.duracionAsesoriaMinutos === '' ? null : Number(datos.duracionAsesoriaMinutos),
    maximoPersonasAsesoria: datos.maximoPersonasAsesoria === '' ? null : Number(datos.maximoPersonasAsesoria),
    horasVigenciaQr: datos.horasVigenciaQr === '' ? null : Number(datos.horasVigenciaQr),
  };
}
export function horariosDeFecha(fecha: string, parametros: Parametros): HorarioAtencion[] {
  const dia = new Date(`${fecha}T00:00:00`).getDay();
  return parametros.horarios.filter((horario) => horario.dia === dia)
    .sort((a, b) => a.abre.localeCompare(b.abre));
}
