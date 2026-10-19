/**
 * Reglas de la bandeja de reservas del personal (HU-19). Funciones puras, sin hooks.
 * - Qué acciones tiene cada estado (CA1).
 * - Los motivos y la otra fecha se validan antes de enviar (CA2); la API vuelve a validar
 *   el motivo, los choques de horario (CA3) y que el día sea hábil (HU-28).
 */
import { z } from 'zod';

import type { EstadoSolicitud } from '@/types';
import { esFechaValida, esHoraValida } from '@/utils/fechas';

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
