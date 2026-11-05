/**
 * Formulario para solicitar una capacitación (HU-10): validación y valores iniciales.
 * Funciones puras, sin hooks. Los mensajes son los mismos de la API (#182), para que la persona
 * lea lo mismo antes y después de enviar. La anticipación mínima la revisa la API, que devuelve
 * una fecha sugerida (CA3).
 * Al final, lo de la bandeja del personal (HU-12): acciones por estado, avisos y búsqueda.
 */
import { z } from 'zod';

import type {
  EstadoSolicitud,
  ModalidadCapacitacion,
  Parametros,
  SolicitudCapacitacion,
} from '@/types';
import { esFechaValida, esHoraValida } from '@/utils/fechas';
import { esDiaHabil, motivoNoDisponible } from '@/utils/parametros';
import { normalizarTexto } from '@/utils/texto';

export const LARGO_MAXIMO_OBJETIVO = 300;
export const LARGO_MAXIMO_GRUPO = 200;
export const MAXIMO_PARTICIPANTES = 100;
/** Hasta cuántos meses adelante se ofrece el calendario. */
export const MESES_CAPACITACION = 3;

export const MODALIDADES_CAPACITACION: {
  valor: ModalidadCapacitacion;
  etiqueta: string;
  icono: string;
}[] = [
  { valor: 'presencial', etiqueta: 'Presencial', icono: 'account-group-outline' },
  { valor: 'virtual', etiqueta: 'Virtual', icono: 'laptop' },
];

/** Motivo de un día no hábil (CA3). Sale una sola vez, bajo el campo Fecha. */
export function mensajeDiaNoHabil(fecha: string, parametros: Parametros): string {
  return `Ese día no hay atención: ${motivoNoDisponible(fecha, parametros)}.`;
}

/**
 * Validación del formulario (CA2). Con parámetros, también marca la fecha que no es un día
 * hábil (CA3); la fecha sugerida la ofrece el formulario aparte, debajo del campo.
 */
export function esquemaSolicitudCapacitacion(parametros: Parametros) {
  return z
    .object({
      lineaId: z.string().trim().min(1, { error: 'Elige la línea de formación.' }),
      // Texto y no z.enum: empieza vacía hasta que la persona elige.
      modalidad: z
        .string()
        .refine((valor) => MODALIDADES_CAPACITACION.some((opcion) => opcion.valor === valor), {
          error: 'Elige la modalidad: presencial o virtual.',
        }),
      fecha: z.string().trim().refine(esFechaValida, { error: 'Elige una fecha válida.' }),
      hora: z.string().trim().refine(esHoraValida, { error: 'Elige una hora válida.' }),
      objetivo: z
        .string()
        .trim()
        .min(1, { error: 'Escribe el objetivo de la capacitación.' })
        .max(LARGO_MAXIMO_OBJETIVO, { error: `Máximo ${LARGO_MAXIMO_OBJETIVO} caracteres.` }),
      grupo: z
        .string()
        .trim()
        .min(1, { error: 'Escribe el grupo al que va dirigida.' })
        .max(LARGO_MAXIMO_GRUPO, { error: `Máximo ${LARGO_MAXIMO_GRUPO} caracteres.` }),
      participantes: z
        .string()
        .trim()
        .refine(
          (valor) =>
            /^\d+$/.test(valor) && Number(valor) >= 1 && Number(valor) <= MAXIMO_PARTICIPANTES,
          { error: `Indica cuántas personas asistirán (de 1 a ${MAXIMO_PARTICIPANTES}).` },
        ),
    })
    .superRefine((datos, ctx) => {
      if (esFechaValida(datos.fecha) && !esDiaHabil(datos.fecha, parametros)) {
        ctx.addIssue({
          code: 'custom',
          path: ['fecha'],
          message: mensajeDiaNoHabil(datos.fecha, parametros),
        });
      }
    });
}

/** Lo que guarda el formulario: todo como texto; la modalidad y los números empiezan vacíos. */
export type ValoresSolicitudCapacitacion = z.input<ReturnType<typeof esquemaSolicitudCapacitacion>>;

export const VALORES_INICIALES_CAPACITACION: ValoresSolicitudCapacitacion = {
  lineaId: '',
  modalidad: '',
  fecha: '',
  hora: '',
  objetivo: '',
  grupo: '',
  participantes: '',
};

// ── HU-12: gestionar las solicitudes de formación ──────────────────────────

/** Nombre de la modalidad para mostrarlo ("Presencial" o "Virtual"). */
export function nombreModalidad(modalidad: ModalidadCapacitacion): string {
  return MODALIDADES_CAPACITACION.find((opcion) => opcion.valor === modalidad)?.etiqueta ?? '';
}

/** Lo que el personal puede hacer con una solicitud de capacitación (CA1 y CA3). */
export type AccionCapacitacion = 'aprobar' | 'nueva_fecha' | 'rechazar' | 'responsable' | 'cerrar';

/**
 * Acciones de cada estado: aprobar, proponer otra fecha y rechazar mientras está pendiente;
 * asignar responsable y cerrar cuando está aprobada. Lo ya resuelto no tiene acciones.
 * Con nueva fecha no se aprueba: la fecha propuesta la confirma el usuario (CA4), y aprobar
 * dejaría la fecha original con la propuesta sin respuesta. Mientras tanto, el personal puede
 * proponer otra o rechazar. La API (#188) todavía deja aprobar en ese estado: el Backend debe
 * rechazarlo.
 */
export const ACCIONES_CAPACITACION: Record<EstadoSolicitud, readonly AccionCapacitacion[]> = {
  pendiente: ['aprobar', 'nueva_fecha', 'rechazar'],
  nueva_fecha: ['nueva_fecha', 'rechazar'],
  aprobada: ['responsable', 'cerrar'],
  rechazada: [],
  cancelada: [],
  realizada: [],
};

export const NOMBRE_ACCION_CAPACITACION: Record<AccionCapacitacion, string> = {
  aprobar: 'Aprobar',
  nueva_fecha: 'Otra fecha',
  rechazar: 'Rechazar',
  responsable: 'Asignar responsable',
  cerrar: 'Marcar como realizada',
};

/**
 * Quién maneja el responsable de una capacitación aprobada (CA3). Así nadie se quita una
 * capacitación asignada ni se la pasa a otro sin que lo decida la administración:
 * - sin responsable, cualquiera del personal con `formacion` puede tomarla ("Asignarme");
 * - la administración la asigna a quien elija y es la única que cambia al responsable;
 * - la marca como realizada el responsable o la administración.
 * La regla vive en la interfaz: el Backend también debe validarla.
 */
type QuienGestiona = { usuarioId: string | undefined; esAdministrador: boolean };
type ConResponsable = Pick<SolicitudCapacitacion, 'estado' | 'responsableId'>;

export function puedeTomarCapacitacion(solicitud: ConResponsable): boolean {
  return solicitud.estado === 'aprobada' && !solicitud.responsableId;
}

export function puedeCambiarResponsable(
  solicitud: ConResponsable,
  { esAdministrador }: QuienGestiona,
): boolean {
  return solicitud.estado === 'aprobada' && esAdministrador;
}

export function puedeMarcarRealizada(
  solicitud: ConResponsable,
  { usuarioId, esAdministrador }: QuienGestiona,
): boolean {
  if (solicitud.estado !== 'aprobada' || !solicitud.responsableId) return false;
  return esAdministrador || solicitud.responsableId === usuarioId;
}

/** Aviso al tomar una capacitación sin responsable. */
export const AVISO_ASIGNARME = 'Quedaste como responsable de esta capacitación.';

/**
 * Aviso que confirma lo guardado. Asignar el responsable no notifica al solicitante, sino a la
 * persona asignada.
 */
export function avisoCapacitacion(
  accion: AccionCapacitacion,
  solicitud: Pick<SolicitudCapacitacion, 'solicitante'>,
  responsable?: string,
): string {
  const persona = solicitud.solicitante.nombre;
  switch (accion) {
    case 'aprobar':
      return `Solicitud aprobada. Se notificó a ${persona}.`;
    case 'rechazar':
      return `Solicitud rechazada. Se notificó a ${persona}.`;
    case 'nueva_fecha':
      return `Nueva fecha propuesta. ${persona} debe aceptarla.`;
    case 'responsable':
      return responsable
        ? `Responsable asignado: ${responsable}. Se le notificó.`
        : 'Responsable asignado.';
    case 'cerrar':
      return `Capacitación marcada como realizada. Se notificó a ${persona}.`;
  }
}

/** Las solicitudes cuya persona, línea o grupo contienen el texto; sin texto, todas. */
export function buscarCapacitaciones(
  solicitudes: SolicitudCapacitacion[],
  texto: string,
): SolicitudCapacitacion[] {
  const buscado = normalizarTexto(texto.trim());
  if (!buscado) return solicitudes;
  return solicitudes.filter((solicitud) =>
    [solicitud.solicitante.nombre, solicitud.linea, solicitud.grupo].some((campo) =>
      normalizarTexto(campo).includes(buscado),
    ),
  );
}

/** "25 participantes" o "1 participante". */
export function textoParticipantes(cantidad: number): string {
  return `${cantidad} ${cantidad === 1 ? 'participante' : 'participantes'}`;
}

/**
 * Por qué no se puede proponer un día (CA1), para el calendario del diálogo: ni días pasados
 * ni días sin atención (HU-28). La anticipación mínima la revisa la API, como en HU-10.
 */
export function motivoDiaCapacitacion(
  fecha: string,
  parametros: Parametros,
  hoy: string,
): string | null {
  if (fecha < hoy) return 'ya pasó';
  return esDiaHabil(fecha, parametros) ? null : motivoNoDisponible(fecha, parametros);
}

/** Una fecha con su hora, para comparar propuestas. */
type FechaHora = { fecha: string; hora: string };

/**
 * Las fechas que no se pueden volver a proponer: la que pidió el usuario y, si hay, la que ya
 * se le propuso. Proponer la misma no cambiaría nada.
 */
export function fechasYaUsadas(
  solicitud: Pick<SolicitudCapacitacion, 'fecha' | 'hora' | 'fechaPropuesta' | 'horaPropuesta'>,
): FechaHora[] {
  const usadas: FechaHora[] = [{ fecha: solicitud.fecha, hora: solicitud.hora }];
  if (solicitud.fechaPropuesta && solicitud.horaPropuesta) {
    usadas.push({ fecha: solicitud.fechaPropuesta, hora: solicitud.horaPropuesta });
  }
  return usadas;
}

/**
 * Proponer otra fecha (CA1): fecha hábil y hora, elegidas en el calendario y el reloj, y
 * distintas de las que ya tiene la solicitud (`usadas`). El mismo día a otra hora sí se puede.
 */
export function esquemaFechaCapacitacion(parametros: Parametros, usadas: FechaHora[] = []) {
  return z
    .object({
      fecha: z.string().trim().refine(esFechaValida, { error: 'Elige la nueva fecha.' }),
      hora: z.string().trim().refine(esHoraValida, { error: 'Elige la hora.' }),
    })
    .superRefine((datos, ctx) => {
      if (esFechaValida(datos.fecha) && !esDiaHabil(datos.fecha, parametros)) {
        ctx.addIssue({
          code: 'custom',
          path: ['fecha'],
          message: mensajeDiaNoHabil(datos.fecha, parametros),
        });
      }
      if (usadas.some((usada) => usada.fecha === datos.fecha && usada.hora === datos.hora)) {
        ctx.addIssue({
          code: 'custom',
          path: ['hora'],
          message: 'Es la misma fecha y hora que ya tiene la solicitud. Elige otra.',
        });
      }
    });
}

export type ValoresFechaCapacitacion = z.input<ReturnType<typeof esquemaFechaCapacitacion>>;

/** El mismo límite de la API para el motivo y el resultado. */
export const LARGO_MAXIMO_RESULTADO = 300;

/** CA3: cerrar exige el resultado, que el usuario recibe en la notificación. */
export const esquemaResultado = z.object({
  resultado: z
    .string()
    .trim()
    .min(1, { error: 'Escribe el resultado de la capacitación.' })
    .max(LARGO_MAXIMO_RESULTADO, { error: `Máximo ${LARGO_MAXIMO_RESULTADO} caracteres.` }),
});

export type ValoresResultado = z.input<typeof esquemaResultado>;
