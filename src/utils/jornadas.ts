/**
 * Formulario de jornadas y temas de asesoría (HU-13): opciones, validación y vista previa.
 * Funciones puras, sin hooks.
 *
 * Reutiliza las reglas de la biblioteca: horas en punto (problemaHorario), días hábiles y
 * horario de atención (HU-28), y la generación de franjas de Jorge (generarFranjas). Lo propio
 * de la jornada: que quepa en el horario de cada día elegido, que la vigencia tenga sentido y
 * que no se traslape con otra jornada activa del mismo facilitador (CA2).
 */
import { z } from 'zod';

import type { FranjaAsesoria, Jornada, ModalidadAsesoria, Parametros, TemaAsesoria } from '@/types';
import { sumarDias } from '@/utils/calendario';
import { esFechaValida, esHoraValida, fechaLegible } from '@/utils/fechas';
import { aMinutos, generarFranjas } from '@/utils/franjas';
import { esDiaHabil, NOMBRE_DIA, ORDEN_DIAS } from '@/utils/parametros';
import { problemaHorario } from '@/utils/reservas';

/** Duraciones de cita que se ofrecen, en minutos. */
export const DURACIONES = [15, 20, 30, 45, 60, 90] as const;
/** Cupos por franja que se ofrecen. */
export const CUPOS = [1, 2, 3, 4, 5, 6, 8, 10] as const;
/** La vigencia puede durar hasta un año: más larga suele ser un error de digitación. */
export const DIAS_MAXIMOS_VIGENCIA = 366;

export const NOMBRE_MODALIDAD: Record<ModalidadAsesoria, string> = {
  presencial: 'Presencial',
  virtual: 'Virtual',
};

/** Días en el orden de la semana de la biblioteca (lunes primero), con su nombre corto. */
export const DIAS_SEMANA = ORDEN_DIAS.map((dia) => ({
  dia,
  nombre: NOMBRE_DIA[dia],
  corto: NOMBRE_DIA[dia].slice(0, 3),
}));

/** "lunes y miércoles" o "lunes, miércoles y viernes", en el orden de la semana. */
export function describirDias(dias: number[]): string {
  const nombres = ORDEN_DIAS.filter((dia) => dias.includes(dia)).map((dia) =>
    NOMBRE_DIA[dia].toLowerCase(),
  );
  if (nombres.length <= 1) return nombres.join('');
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

/** Horario de atención de un día de la semana (HU-28), o undefined si no se atiende. */
export const horarioDeDia = (dia: number, parametros: Parametros) =>
  parametros.horarios.find((horario) => horario.dia === dia);

/** ¿La biblioteca atiende ese día de la semana? */
export const atiendeDia = (dia: number, parametros: Parametros) =>
  horarioDeDia(dia, parametros) != null;

/**
 * Ventana común de los días elegidos: abre a la hora más tardía de apertura y cierra a la
 * más temprana de cierre, para que la jornada quepa en todos. undefined si no hay días.
 */
export function ventanaComun(dias: number[], parametros: Parametros) {
  const horarios = dias.map((dia) => horarioDeDia(dia, parametros)).filter((h) => h != null);
  if (horarios.length === 0 || horarios.length !== dias.length) return undefined;
  return {
    abre: horarios.reduce((max, h) => (h.abre > max ? h.abre : max), horarios[0].abre),
    cierra: horarios.reduce((min, h) => (h.cierra < min ? h.cierra : min), horarios[0].cierra),
  };
}

// ── Formulario de jornada ─────────────────────────────────────────────────────────────

const camposJornada = z.object({
  temaId: z.string().min(1, { error: 'Elige el tema.' }),
  facilitadorId: z.string().min(1, { error: 'Elige el facilitador.' }),
  dias: z.array(z.number()).min(1, { error: 'Elige al menos un día.' }),
  horaInicio: z.string(),
  horaFin: z.string(),
  duracionMinutos: z.number(),
  cupos: z.number(),
  modalidad: z.enum(['presencial', 'virtual']),
  vigenciaDesde: z.string(),
  vigenciaHasta: z.string(),
  excepciones: z.array(z.string()),
  activa: z.boolean(),
});

export type DatosFormularioJornada = z.infer<typeof camposJornada>;

/** Jornada provisional, para la vista previa y las comprobaciones. */
export const aJornada = (datos: DatosFormularioJornada, id = 'previa'): Jornada => ({ ...datos, id });

/** Franjas que generaría la jornada (CA1), con la misma función que usa la API. */
export function franjasPrevias(datos: DatosFormularioJornada, parametros: Parametros): FranjaAsesoria[] {
  if (
    datos.dias.length === 0 ||
    !esHoraValida(datos.horaInicio) ||
    !esHoraValida(datos.horaFin) ||
    !esFechaValida(datos.vigenciaDesde) ||
    !esFechaValida(datos.vigenciaHasta) ||
    datos.vigenciaDesde > datos.vigenciaHasta
  ) {
    return [];
  }
  return generarFranjas(aJornada(datos), parametros);
}

/** ¿Se traslapan dos jornadas del mismo facilitador? (misma regla que la API, CA2). */
export function seTraslapan(a: Omit<Jornada, 'id'>, b: Omit<Jornada, 'id'>): boolean {
  return (
    a.activa &&
    b.activa &&
    a.facilitadorId === b.facilitadorId &&
    a.dias.some((dia) => b.dias.includes(dia)) &&
    a.vigenciaDesde <= b.vigenciaHasta &&
    b.vigenciaDesde <= a.vigenciaHasta &&
    aMinutos(a.horaInicio) < aMinutos(b.horaFin) &&
    aMinutos(b.horaInicio) < aMinutos(a.horaFin)
  );
}

/** "Normas APA 7 · lunes y miércoles, 09:00 a 12:00". */
export function resumenJornada(jornada: Jornada, temas: TemaAsesoria[]): string {
  const tema = temas.find((t) => t.id === jornada.temaId)?.nombre ?? 'Tema sin nombre';
  return `${tema} · ${describirDias(jornada.dias)}, ${jornada.horaInicio} a ${jornada.horaFin}`;
}

type ContextoJornada = {
  parametros: Parametros;
  /** Todas las jornadas, para avisar el traslape antes de guardar (CA2). */
  jornadas: Jornada[];
  temas: TemaAsesoria[];
  hoy: string;
  /** Al editar: la jornada original. Su vigencia puede haber empezado antes de hoy. */
  original?: Jornada;
};

/** Validación del formulario de jornada (HU-13) con los parámetros y las demás jornadas. */
export function crearEsquemaJornada({ parametros, jornadas, temas, hoy, original }: ContextoJornada) {
  return camposJornada.superRefine((datos, ctx) => {
    const error = (campo: keyof DatosFormularioJornada, message: string) =>
      ctx.addIssue({ code: 'custom', message, path: [campo] });

    // Sin días, el campo ya dice "Elige al menos un día": lo demás depende de ellos.
    if (datos.dias.length === 0) return;

    // Días: solo los que la biblioteca atiende.
    const sinAtencion = datos.dias.filter((dia) => !atiendeDia(dia, parametros));
    if (sinAtencion.length > 0) {
      error('dias', `La biblioteca no atiende el ${describirDias(sinAtencion)}.`);
      return;
    }

    // Horario: horas en punto, fin después del inicio y dentro de la atención de cada día.
    if (!esHoraValida(datos.horaInicio)) error('horaInicio', 'Elige la hora de inicio.');
    if (!esHoraValida(datos.horaFin)) error('horaFin', 'Elige la hora de fin.');
    if (!esHoraValida(datos.horaInicio) || !esHoraValida(datos.horaFin)) return;
    const problema = problemaHorario(datos.horaInicio, datos.horaFin);
    if (problema) {
      error(problema.campo, problema.mensaje);
      return;
    }
    for (const dia of datos.dias) {
      const horario = horarioDeDia(dia, parametros)!;
      if (datos.horaInicio < horario.abre) {
        error('horaInicio', `El ${NOMBRE_DIA[dia].toLowerCase()} la biblioteca abre a las ${horario.abre}.`);
        return;
      }
      if (datos.horaFin > horario.cierra) {
        error('horaFin', `El ${NOMBRE_DIA[dia].toLowerCase()} la biblioteca cierra a las ${horario.cierra}.`);
        return;
      }
    }

    // Duración y cupos: de las opciones, y la cita cabe en el horario.
    if (!(DURACIONES as readonly number[]).includes(datos.duracionMinutos)) {
      error('duracionMinutos', 'Elige la duración de cada cita.');
      return;
    }
    if (aMinutos(datos.horaInicio) + datos.duracionMinutos > aMinutos(datos.horaFin)) {
      error('duracionMinutos', 'La cita no cabe en el horario: alarga el horario o acorta la duración.');
      return;
    }
    if (!(CUPOS as readonly number[]).includes(datos.cupos)) {
      error('cupos', 'Elige los cupos por franja.');
      return;
    }

    // Vigencia: fechas reales, en orden, no más de un año y, si es nueva, desde hoy.
    if (!esFechaValida(datos.vigenciaDesde)) error('vigenciaDesde', 'Elige desde cuándo rige.');
    if (!esFechaValida(datos.vigenciaHasta)) error('vigenciaHasta', 'Elige hasta cuándo rige.');
    if (!esFechaValida(datos.vigenciaDesde) || !esFechaValida(datos.vigenciaHasta)) return;
    const desdeOriginal = original?.vigenciaDesde === datos.vigenciaDesde;
    if (datos.vigenciaDesde < hoy && !desdeOriginal) {
      error('vigenciaDesde', 'La vigencia no puede empezar en una fecha pasada.');
      return;
    }
    if (datos.vigenciaHasta < hoy) {
      error('vigenciaHasta', 'La vigencia ya terminó: elige una fecha final desde hoy.');
      return;
    }
    if (datos.vigenciaHasta < datos.vigenciaDesde) {
      error('vigenciaHasta', 'La fecha final no puede ser anterior a la inicial.');
      return;
    }
    if (datos.vigenciaHasta > sumarDias(datos.vigenciaDesde, DIAS_MAXIMOS_VIGENCIA)) {
      error('vigenciaHasta', 'La vigencia puede durar máximo un año.');
      return;
    }

    // Excepciones: dentro de la vigencia (CA3).
    const fuera = datos.excepciones.find((f) => f < datos.vigenciaDesde || f > datos.vigenciaHasta);
    if (fuera) {
      error('excepciones', `El ${fechaLegible(fuera)} está fuera de la vigencia: quítalo.`);
      return;
    }

    // Debe generar al menos una franja (CA1).
    if (franjasPrevias(datos, parametros).length === 0) {
      error('vigenciaHasta', 'Con estos días y esta vigencia no se genera ninguna franja.');
      return;
    }

    // Sin traslape con otra jornada activa del mismo facilitador (CA2).
    const nueva = aJornada(datos, original?.id ?? 'nueva');
    const traslape = jornadas.find((otra) => otra.id !== original?.id && seTraslapan(nueva, otra));
    if (traslape) {
      error('horaInicio', `Se traslapa con otra jornada del facilitador: ${resumenJornada(traslape, temas)}. Ajusta los días o el horario.`);
    }
  });
}

/** Por qué una fecha no se puede excluir, o null si se puede (CA3). */
export function motivoNoExcluible(
  fecha: string,
  datos: Pick<DatosFormularioJornada, 'dias' | 'vigenciaDesde' | 'vigenciaHasta' | 'excepciones'>,
  parametros: Parametros,
): string | null {
  if (fecha < datos.vigenciaDesde || fecha > datos.vigenciaHasta) return 'fuera de la vigencia';
  if (!datos.dias.includes(new Date(`${fecha}T00:00:00`).getDay())) return 'no es un día de la jornada';
  if (!esDiaHabil(fecha, parametros)) return 'ya no tiene franjas: no es día hábil';
  if (datos.excepciones.includes(fecha)) return 'ya está excluida';
  return null;
}

// ── Formulario de tema ────────────────────────────────────────────────────────────────

const texto = (campo: string, minimo: number, maximo: number) =>
  z
    .string()
    .trim()
    .min(minimo, { error: `Escribe ${campo} (al menos ${minimo} caracteres).` })
    .max(maximo, { error: `Máximo ${maximo} caracteres.` });

/** Validación del formulario de tema (HU-13). El nombre no se repite entre temas. */
export function crearEsquemaTema(temas: TemaAsesoria[], idActual?: string) {
  return z
    .object({
      nombre: texto('el nombre del tema', 3, 80),
      descripcion: texto('la descripción', 10, 300),
      activo: z.boolean(),
    })
    .superRefine((datos, ctx) => {
      const nombre = datos.nombre.trim().toLocaleLowerCase('es');
      const repetido = temas.some(
        (tema) => tema.id !== idActual && tema.nombre.trim().toLocaleLowerCase('es') === nombre,
      );
      if (repetido) {
        ctx.addIssue({ code: 'custom', message: 'Ya existe un tema con ese nombre.', path: ['nombre'] });
      }
    });
}

export type DatosFormularioTema = z.infer<ReturnType<typeof crearEsquemaTema>>;
