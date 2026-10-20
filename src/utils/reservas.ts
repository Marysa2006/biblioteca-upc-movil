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
    fecha: z.string().trim().refine(esFechaValida, { error: 'Usa el formato AAAA-MM-DD.' }),
    horaInicio: z.string().trim().refine(esHoraValida, { error: 'Usa el formato HH:MM.' }),
    horaFin: z.string().trim().refine(esHoraValida, { error: 'Usa el formato HH:MM.' }),
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

const LARGO_MAXIMO_PROPOSITO = 200;

/** Lo que necesita el esquema de la reserva para terceros para validar el día y la capacidad. */
type ContextoReserva = { parametros: Parametros; espacios: Espacio[]; hoy: string };

/**
 * Reserva que el personal crea en nombre de otra persona (HU-19).
 * Valida antes de enviar: la fecha no pasada y hábil (esDiaHabil de HU-28, con su motivo), el
 * horario y que los asistentes no pasen la capacidad del espacio. La API vuelve a validar el
 * día hábil y los choques de horario (CA3).
 */
export function esquemaReservaTercero({ parametros, espacios, hoy }: ContextoReserva) {
  return z
    .object({
      solicitanteId: z.string().min(1, { error: 'Elige a la persona que reserva.' }),
      espacioId: z.string().min(1, { error: 'Elige el espacio.' }),
      fecha: z.string().trim().refine(esFechaValida, { error: 'Usa el formato AAAA-MM-DD.' }),
      horaInicio: z.string().trim().refine(esHoraValida, { error: 'Usa el formato HH:MM.' }),
      horaFin: z.string().trim().refine(esHoraValida, { error: 'Usa el formato HH:MM.' }),
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
    })
    .superRefine((datos, ctx) => {
      if (esFechaValida(datos.fecha)) {
        const motivo = motivoNoDisponible(datos.fecha, parametros);
        if (datos.fecha < hoy) {
          ctx.addIssue({ code: 'custom', path: ['fecha'], message: 'La fecha ya pasó.' });
        } else if (motivo) {
          ctx.addIssue({ code: 'custom', path: ['fecha'], message: `No disponible: ${motivo}.` });
        }
      }

      const horasValidas = esHoraValida(datos.horaInicio) && esHoraValida(datos.horaFin);
      if (horasValidas && datos.horaFin <= datos.horaInicio) {
        ctx.addIssue({
          code: 'custom',
          path: ['horaFin'],
          message: 'La hora de fin debe ser después de la de inicio.',
        });
      }

      const lugar = espacios.find((e) => e.id === datos.espacioId);
      if (/^\d+$/.test(datos.asistentes)) {
        const cantidad = Number(datos.asistentes);
        if (cantidad < 1) {
          ctx.addIssue({
            code: 'custom',
            path: ['asistentes'],
            message: 'Debe asistir al menos 1 persona.',
          });
        } else if (lugar && cantidad > lugar.capacidad) {
          ctx.addIssue({
            code: 'custom',
            path: ['asistentes'],
            message: `${lugar.nombre} admite hasta ${lugar.capacidad} personas.`,
          });
        }
      }
    });
}

export type FormularioReservaTercero = z.input<ReturnType<typeof esquemaReservaTercero>>;
