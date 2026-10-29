/**
 * Reglas de la bandeja de reservas del personal (HU-19). Funciones puras, sin hooks.
 * - Qué acciones tiene cada estado (CA1).
 * - Los motivos y la otra fecha se validan antes de enviar (CA2); la API vuelve a validar
 *   el motivo, los choques de horario (CA3) y que el día sea hábil (HU-28).
 */
import { z } from 'zod';

import type { Espacio, EstadoSolicitud, Parametros } from '@/types';
import { esFechaValida, esHoraValida } from '@/utils/fechas';
import { motivoNoDisponible } from '@/utils/parametros';

/** Lo que el personal decide sobre una solicitud; lo mismo que recibe useDecidirReserva(). */
export type AccionReserva = 'aprobar' | 'nueva_fecha' | 'rechazar' | 'cancelar';

/** Orden de los chips de la bandeja: primero lo que hay que atender. */
export const ORDEN_ESTADOS: EstadoSolicitud[] = [
  'pendiente',
  'nueva_fecha',
  'aprobada',
  'rechazada',
  'cancelada',
  'realizada',
];

/** Acciones de cada estado (CA1). Lo ya resuelto no tiene acciones. */
export const ACCIONES_POR_ESTADO: Record<EstadoSolicitud, AccionReserva[]> = {
  pendiente: ['aprobar', 'nueva_fecha', 'rechazar'],
  aprobada: ['nueva_fecha', 'cancelar'],
  nueva_fecha: ['nueva_fecha', 'cancelar'],
  rechazada: [],
  cancelada: [],
  realizada: [],
};

export const NOMBRE_ACCION: Record<AccionReserva, string> = {
  aprobar: 'Aprobar',
  nueva_fecha: 'Otra fecha',
  rechazar: 'Rechazar',
  cancelar: 'Cancelar',
};

const TITULO_AVISO: Record<AccionReserva, string> = {
  aprobar: 'Reserva aprobada',
  nueva_fecha: 'Nueva fecha propuesta',
  rechazar: 'Reserva rechazada',
  cancelar: 'Reserva cancelada',
};

/** "Reserva aprobada. Se notificó a Laura Pérez." (CA4). */
export function avisoDecision(accion: AccionReserva, solicitante: string): string {
  return `${TITULO_AVISO[accion]}. Se notificó a ${solicitante}.`;
}

const LARGO_MAXIMO_MOTIVO = 300;

/** CA2: rechazar o cancelar exige la justificación. */
export const esquemaMotivo = z.object({
  motivo: z
    .string()
    .trim()
    .min(1, { error: 'Escribe el motivo: la persona lo recibe en la notificación.' })
    .max(LARGO_MAXIMO_MOTIVO, { error: `Máximo ${LARGO_MAXIMO_MOTIVO} caracteres.` }),
});

export type FormularioMotivo = z.input<typeof esquemaMotivo>;

/** Otra fecha (CA1, "modificar"): fecha y horario válidos, con el fin después del inicio. */
export const esquemaOtraFecha = z
  .object({
    fecha: z.string().trim().refine(esFechaValida, { error: 'Elige una fecha en el calendario.' }),
    horaInicio: z.string().trim().refine(esHoraValida, { error: 'Elige una hora.' }),
    horaFin: z.string().trim().refine(esHoraValida, { error: 'Elige una hora.' }),
    motivo: z
      .string()
      .trim()
      .max(LARGO_MAXIMO_MOTIVO, { error: `Máximo ${LARGO_MAXIMO_MOTIVO} caracteres.` }),
  })
  .superRefine((datos, ctx) => {
    const horasValidas = esHoraValida(datos.horaInicio) && esHoraValida(datos.horaFin);
    if (horasValidas && datos.horaFin <= datos.horaInicio) {
      ctx.addIssue({
        code: 'custom',
        path: ['horaFin'],
        message: 'La hora de fin debe ser después de la de inicio.',
      });
    }
  });

export type FormularioOtraFecha = z.input<typeof esquemaOtraFecha>;

// ── Reglas de una reserva ─────────────────────────────────────────────────────────────
// Las comparten la solicitud de la comunidad (HU-18) y la reserva para terceros (HU-19):
// si una regla de la biblioteca cambia, cambia en los dos formularios. Cada formulario tiene
// su propio esquema con sus campos. Devuelven el mensaje para la persona o null.

/** Hasta cuántos meses adelante se puede elegir el día de una reserva en el calendario. */
export const MESES_RESERVA = 3;

/**
 * Por qué un día no se ofrece en el calendario de una reserva, o null si se puede elegir:
 * ya pasó o no es hábil (motivoNoDisponible, HU-28). Sin parámetros, solo los días pasados.
 */
export function motivoDiaReserva(
  dia: string,
  parametros: Parametros | undefined,
  hoy: string,
): string | null {
  if (dia < hoy) return 'ya pasó';
  return parametros ? motivoNoDisponible(dia, parametros) : null;
}

/** La fecha no pasó y es un día hábil (HU-28). Si falta la fecha, lo dice el campo. */
export function problemaFecha(fecha: string, parametros: Parametros, hoy: string): string | null {
  if (!esFechaValida(fecha)) return null;
  if (fecha < hoy) return 'La fecha ya pasó.';
  const motivo = motivoNoDisponible(fecha, parametros);
  return motivo ? `No disponible: ${motivo}.` : null;
}

type ProblemaHorario = { campo: 'horaInicio' | 'horaFin'; mensaje: string };

/** Horas en punto (las franjas son de una hora) y el fin después del inicio. */
export function problemaHorario(inicio: string, fin: string): ProblemaHorario | null {
  if (!esHoraValida(inicio) || !esHoraValida(fin)) return null;
  const enPunto = 'Usa horas en punto, por ejemplo 14:00.';
  if (!inicio.endsWith(':00')) return { campo: 'horaInicio', mensaje: enPunto };
  if (!fin.endsWith(':00')) return { campo: 'horaFin', mensaje: enPunto };
  if (fin <= inicio) {
    return { campo: 'horaFin', mensaje: 'La hora de fin debe ser después de la de inicio.' };
  }
  return null;
}

/** Al menos 1 asistente y no más que la capacidad del espacio (HU-18, CA3). */
export function problemaCapacidad(asistentes: string, espacio: Espacio | undefined): string | null {
  if (!/^\d+$/.test(asistentes)) return null;
  const cantidad = Number(asistentes);
  if (cantidad < 1) return 'Debe asistir al menos 1 persona.';
  if (espacio && cantidad > espacio.capacidad) {
    return `${espacio.nombre} admite hasta ${espacio.capacidad} personas. Ajusta el número.`;
  }
  return null;
}

const LARGO_MAXIMO_PROPOSITO = 200;

/** Campos que tienen las dos reservas: la fecha y las horas se eligen, no se escriben. */
const camposReserva = {
  fecha: z.string().trim().refine(esFechaValida, { error: 'Elige una fecha en el calendario.' }),
  horaInicio: z.string().trim().refine(esHoraValida, { error: 'Elige una hora.' }),
  horaFin: z.string().trim().refine(esHoraValida, { error: 'Elige una hora.' }),
  proposito: z
    .string()
    .trim()
    .min(1, { error: 'Escribe el propósito de la reserva.' })
    .max(LARGO_MAXIMO_PROPOSITO, { error: `Máximo ${LARGO_MAXIMO_PROPOSITO} caracteres.` }),
  asistentes: z.string().trim().regex(/^\d+$/, { error: 'Escribe un número entero.' }),
  requerimientos: z
    .string()
    .trim()
    .max(LARGO_MAXIMO_MOTIVO, { error: `Máximo ${LARGO_MAXIMO_MOTIVO} caracteres.` }),
};

type DatosReglas = { fecha: string; horaInicio: string; horaFin: string; asistentes: string };

/** Aplica las tres reglas y marca el error en su campo. */
function aplicarReglas(
  datos: DatosReglas,
  ctx: z.RefinementCtx,
  { parametros, hoy, espacio }: { parametros: Parametros; hoy: string; espacio: Espacio | undefined },
) {
  const fecha = problemaFecha(datos.fecha, parametros, hoy);
  if (fecha) ctx.addIssue({ code: 'custom', path: ['fecha'], message: fecha });

  const horario = problemaHorario(datos.horaInicio, datos.horaFin);
  if (horario) ctx.addIssue({ code: 'custom', path: [horario.campo], message: horario.mensaje });

  const capacidad = problemaCapacidad(datos.asistentes, espacio);
  if (capacidad) ctx.addIssue({ code: 'custom', path: ['asistentes'], message: capacidad });
}

/** Lo que necesita el esquema de la reserva para terceros para validar el día y la capacidad. */
type ContextoReserva = { parametros: Parametros; espacios: Espacio[]; hoy: string };

/**
 * Reserva que el personal crea en nombre de otra persona (HU-19).
 * Valida antes de enviar las reglas de la reserva; la API vuelve a validar el día hábil y los
 * choques de horario (CA3).
 */
export function esquemaReservaTercero({ parametros, espacios, hoy }: ContextoReserva) {
  return z
    .object({
      solicitanteId: z.string().min(1, { error: 'Elige a la persona que reserva.' }),
      espacioId: z.string().min(1, { error: 'Elige el espacio.' }),
      ...camposReserva,
    })
    .superRefine((datos, ctx) =>
      aplicarReglas(datos, ctx, {
        parametros,
        hoy,
        espacio: espacios.find((e) => e.id === datos.espacioId),
      }),
    );
}

export type FormularioReservaTercero = z.input<ReturnType<typeof esquemaReservaTercero>>;

/** Lo que necesita el esquema de la solicitud para validar el día y la capacidad. */
type ContextoSolicitud = { parametros: Parametros; espacio: Espacio; hoy: string };

/**
 * Solicitud de reserva de la comunidad (HU-18): el espacio ya viene del calendario y el
 * solicitante sale de la sesión. Valida antes de enviar las reglas de la reserva (CA3: la
 * capacidad); la API vuelve a validar y responde la disponibilidad con alternativas (CA2).
 */
export function esquemaSolicitudReserva({ parametros, espacio, hoy }: ContextoSolicitud) {
  return z
    .object(camposReserva)
    .superRefine((datos, ctx) => aplicarReglas(datos, ctx, { parametros, hoy, espacio }));
}

export type FormularioSolicitud = z.input<ReturnType<typeof esquemaSolicitudReserva>>;
