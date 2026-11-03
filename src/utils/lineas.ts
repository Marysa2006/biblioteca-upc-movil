/**
 * Formulario de líneas de formación (HU-09): validación y orden de la lista.
 * Funciones puras, sin hooks. El nombre repetido se compara igual que la API: sin mayúsculas
 * ni tildes (normalizarTexto), para avisarlo bajo el campo antes de guardar (CA2).
 */
import { z } from 'zod';

import type { LineaFormacion } from '@/types';
import { normalizarTexto } from '@/utils/texto';

const texto = (campo: string, minimo: number, maximo: number) =>
  z
    .string()
    .trim()
    .min(minimo, { error: `Escribe ${campo} (al menos ${minimo} caracteres).` })
    .max(maximo, { error: `Máximo ${maximo} caracteres.` });

/** Validación del formulario de línea (HU-09). Los máximos son los de la API. */
export function crearEsquemaLinea(lineas: LineaFormacion[], idActual?: string) {
  return z
    .object({
      nombre: texto('el nombre de la línea', 3, 80),
      descripcion: texto('la descripción', 10, 300),
      activa: z.boolean(),
    })
    .superRefine((datos, ctx) => {
      const buscado = normalizarTexto(datos.nombre.trim());
      const repetida = lineas.find(
        (linea) => linea.id !== idActual && normalizarTexto(linea.nombre.trim()) === buscado,
      );
      if (repetida) {
        ctx.addIssue({
          code: 'custom',
          path: ['nombre'],
          message: `Ya existe la línea "${repetida.nombre}". Usa otro nombre.`,
        });
      }
    });
}

export type DatosFormularioLinea = z.infer<ReturnType<typeof crearEsquemaLinea>>;

/** Activas primero y, dentro de cada grupo, por nombre. */
export function ordenarLineas(lineas: LineaFormacion[]): LineaFormacion[] {
  return [...lineas].sort(
    (a, b) => Number(b.activa) - Number(a.activa) || a.nombre.localeCompare(b.nombre, 'es'),
  );
}

/** ¿El error de la API es el del nombre repetido? Así se muestra bajo el campo (CA2). */
export function esErrorNombreRepetido(error: Error | null): boolean {
  return error != null && 'estado' in error && error.estado === 400 && /nombre/i.test(error.message) && /existe/i.test(error.message);
}
