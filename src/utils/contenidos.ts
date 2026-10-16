/**
 * Avisos y novedades del portal (HU-04): tipos editables, validación y lo que ve la comunidad.
 * Funciones puras, sin hooks.
 *
 * Los servicios reales se administran aparte (Servicio, HU-04): por eso el formulario no
 * ofrece el tipo 'servicio' de Contenido.
 */
import { z } from 'zod';

import type { Contenido, TipoContenido } from '@/types';
import { esFechaValida } from '@/utils/fechas';

// Se siguen exportando desde aquí para quienes ya las importaban (HU-04).
export { fechaLegible, hoyISO } from '@/utils/fechas';

type InfoTipo = { nombre: string; icono: string };

export const TIPOS_CONTENIDO: Record<TipoContenido, InfoTipo> = {
  servicio: { nombre: 'Servicio', icono: 'room-service-outline' },
  informativo: { nombre: 'Informativo', icono: 'information-outline' },
  aviso: { nombre: 'Aviso', icono: 'bullhorn-outline' },
};

/** Tipos que se crean y editan en "Avisos y novedades". */
export const TIPOS_EDITABLES = ['aviso', 'informativo'] as const;
export type TipoEditable = (typeof TIPOS_EDITABLES)[number];

const fechaOpcional = z
  .string()
  .trim()
  .refine((texto) => texto === '' || esFechaValida(texto), {
    error: 'Usa el formato AAAA-MM-DD, por ejemplo 2026-10-20.',
  });

/** Validación del formulario de aviso o informativo (HU-04, CA3). */
export const esquemaContenido = z
  .object({
    tipo: z.enum(TIPOS_EDITABLES),
    titulo: z
      .string()
      .trim()
      .min(1, { error: 'Escribe el título.' })
      .max(80, { error: 'Máximo 80 caracteres.' }),
    descripcion: z
      .string()
      .trim()
      .min(1, { error: 'Escribe la descripción.' })
      .max(500, { error: 'Máximo 500 caracteres.' }),
    publicado: z.boolean(),
    fechaInicio: fechaOpcional,
    fechaFin: fechaOpcional,
  })
  .refine(
    (datos) =>
      datos.tipo !== 'aviso' ||
      datos.fechaInicio === '' ||
      datos.fechaFin === '' ||
      datos.fechaFin >= datos.fechaInicio,
    { error: 'El fin no puede ser anterior al inicio.', path: ['fechaFin'] },
  );

export type DatosFormularioContenido = z.infer<typeof esquemaContenido>;

/** Un aviso solo se muestra dentro de sus fechas; sin fechas, siempre. */
export function estaVigente(contenido: Contenido, hoy: string): boolean {
  if (contenido.fechaInicio && hoy < contenido.fechaInicio) return false;
  if (contenido.fechaFin && hoy > contenido.fechaFin) return false;
  return true;
}

/** Lo que ve la comunidad en Inicio (CA2 y CA4): publicados, avisos e informativos, vigentes y en orden. */
export function contenidosVisibles(contenidos: Contenido[], hoy: string): Contenido[] {
  return contenidos
    .filter(
      (contenido) =>
        contenido.publicado &&
        (contenido.tipo === 'aviso' || contenido.tipo === 'informativo') &&
        estaVigente(contenido, hoy),
    )
    .sort((a, b) => a.orden - b.orden);
}

