/**
 * Formulario para solicitar una capacitación (HU-10): validación y valores iniciales.
 * Funciones puras, sin hooks. Los mensajes son los mismos de la API (#182), para que la persona
 * lea lo mismo antes y después de enviar. La anticipación mínima la revisa la API, que devuelve
 * una fecha sugerida (CA3).
 */
import { z } from 'zod';

import type { ModalidadCapacitacion, Parametros } from '@/types';
import { esFechaValida, esHoraValida } from '@/utils/fechas';
import { esDiaHabil, motivoNoDisponible } from '@/utils/parametros';

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
