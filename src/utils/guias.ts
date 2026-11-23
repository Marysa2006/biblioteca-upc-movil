/**
 * Pantallas de guías sin conexión (HU-29): estado de cada guía frente a su copia guardada y
 * el texto en bloques para leerlo. Funciones puras, sin hooks.
 *
 * Versión 1.1 (#258): el formulario con que la biblioteca publica sus guías, con enlace (PDF o
 * Drive) o escritas en la app.
 */
import { z } from 'zod';

import type { Guia, GuiaGuardada } from '@/types';
import { enlaceValido } from '@/utils/agenda';

/**
 * Cómo está una guía en el celular: guardada y al día, guardada pero con versión nueva
 * publicada (CA3), o sin guardar (CA4).
 */
export type EstadoGuia = 'guardada' | 'desactualizada' | 'sin_guardar';

export function estadoGuia(guia: Guia, guardadas: GuiaGuardada[]): EstadoGuia {
  const guardada = guardadas.find((g) => g.guia.id === guia.id);
  if (!guardada) return 'sin_guardar';
  return guardada.guia.actualizada < guia.actualizada ? 'desactualizada' : 'guardada';
}

/** Guías publicadas con una versión más nueva que la guardada en el celular (CA3). */
export function guiasDesactualizadas(publicadas: Guia[], guardadas: GuiaGuardada[]): Guia[] {
  return publicadas.filter((guia) => estadoGuia(guia, guardadas) === 'desactualizada');
}

/** Un bloque del texto de una guía: título, párrafo o paso numerado. */
export type BloqueGuia = { tipo: 'titulo' | 'parrafo' | 'paso'; texto: string };

/**
 * Divide el texto plano de una guía en bloques: la primera línea es el título, las que
 * empiezan con "1." son pasos y las demás, párrafos. Las líneas vacías separan.
 */
export function bloquesDeGuia(contenido: string): BloqueGuia[] {
  const lineas = contenido.split('\n').map((linea) => linea.trim()).filter((linea) => linea !== '');
  return lineas.map((texto, indice) => {
    if (indice === 0) return { tipo: 'titulo', texto };
    if (/^\d+[.)]\s/.test(texto)) return { tipo: 'paso', texto };
    return { tipo: 'parrafo', texto };
  });
}

/** Cómo se lee una guía: en el navegador, con su enlace, o escrita en la app (#258). */
export type FormatoGuia = 'enlace' | 'escrita';

export const FORMATOS_GUIA: Record<FormatoGuia, { nombre: string; icono: string }> = {
  enlace: { nombre: 'Enlace (PDF o Drive)', icono: 'link-variant' },
  escrita: { nombre: 'Escrita aquí', icono: 'text-box-outline' },
};

export function formatoDe(guia: Pick<Guia, 'enlace'>): FormatoGuia {
  return guia.enlace ? 'enlace' : 'escrita';
}

/**
 * Formulario de una guía (#258): título y descripción, y según el formato un enlace `https`
 * (CA3) o el contenido escrito.
 */
export const esquemaGuia = z
  .object({
    formato: z.enum(['enlace', 'escrita']),
    titulo: z
      .string()
      .trim()
      .min(1, { error: 'Escribe el título.' })
      .max(80, { error: 'Máximo 80 caracteres.' }),
    descripcion: z
      .string()
      .trim()
      .min(1, { error: 'Escribe la descripción.' })
      .max(200, { error: 'Máximo 200 caracteres.' }),
    enlace: z.string().trim(),
    contenido: z.string().trim().max(5000, { error: 'Máximo 5000 caracteres.' }),
    publicado: z.boolean(),
  })
  .superRefine((datos, ctx) => {
    if (datos.formato === 'enlace') {
      if (datos.enlace === '') {
        ctx.addIssue({
          code: 'custom',
          path: ['enlace'],
          message: 'Pega el enlace del PDF o del Drive de la guía.',
        });
      } else if (!enlaceValido(datos.enlace)) {
        ctx.addIssue({
          code: 'custom',
          path: ['enlace'],
          message: 'El enlace tiene que empezar por https://, por ejemplo https://drive.google.com/…',
        });
      }
    } else if (datos.contenido === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['contenido'],
        message: 'Escribe el contenido de la guía.',
      });
    }
  });

export type FormularioGuia = z.input<typeof esquemaGuia>;

/**
 * Lo que se envía a la API al crear o editar una guía; el id y la fecha de actualización los
 * asigna el sistema. `enlace: null` = la guía no tiene enlace (es escrita): al editar, el Backend
 * lo borra (#297). Con `undefined`, `JSON.stringify` quitaría el campo y el enlace se quedaría.
 */
export type DatosGuia = Omit<Guia, 'id' | 'actualizada' | 'enlace'> & { enlace: string | null };

/** Lo que se envía a la API: solo el enlace o solo el contenido, según el formato. */
export function datosDeGuia(valores: z.output<typeof esquemaGuia>): DatosGuia {
  const conEnlace = valores.formato === 'enlace';
  return {
    titulo: valores.titulo,
    descripcion: valores.descripcion,
    contenido: conEnlace ? '' : valores.contenido,
    enlace: conEnlace ? valores.enlace : null,
    publicado: valores.publicado,
  };
}
