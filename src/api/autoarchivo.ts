/**
 * Orientación de autoarchivo (HU-11): procedimiento, requisitos, formatos y metadatos para
 * depositar un trabajo de grado en el Repositorio Institucional. Solo orienta: el depósito se
 * hace en el repositorio (ver ./repositorio).
 * La guía publicada se muestra aunque su contenido llegue como texto libre.
 */
import { URL_REPOSITORIO } from '@/utils/constantes';

import { peticion, simularRed, usaApi } from './cliente';
import { ORIENTACION_AUTOARCHIVO } from './mocks/autoarchivo';

/**
 * Contenido de la orientación. Es un tipo de contenido de esta capa, no va en src/types.
 * Cada bloque es una lista para que la pantalla la pinte como tal.
 */
export type OrientacionAutoarchivo = {
  titulo: string;
  url?: string | null;
  /** Fecha de la última actualización, 'AAAA-MM-DD'. */
  actualizada?: string;
  texto?: string;
  mensaje?: string | null;
  /** Pasos del procedimiento, en orden. */
  procedimiento: string[];
  requisitos: string[];
  formatos: string[];
  metadatos: string[];
};

/** La orientación completa, con sus cuatro bloques (HU-11, CA1). */
export async function obtenerOrientacionAutoarchivo(): Promise<OrientacionAutoarchivo> {
  if (usaApi('autoarchivo')) {
    const { guide, message, repository_url: url } = await peticion<{
      guide: { body: string; title: string; published_at: string | null; updated_at: string } | null;
      message: string | null;
      repository_url: string | null;
    }>('/portal/self-archive/');
    if (!guide?.body.trim()) return { titulo: '', url, mensaje: message, procedimiento: [], requisitos: [], formatos: [], metadatos: [] };
    const bloques = leerBloques(guide.body);
    return {
      titulo: guide.title,
      url,
      mensaje: message,
      actualizada: (guide.published_at ?? guide.updated_at)?.slice(0, 10),
      ...(bloques ?? { texto: guide.body, procedimiento: [], requisitos: [], formatos: [], metadatos: [] }),
    };
  }
  const orientacion = ORIENTACION_AUTOARCHIVO;
  return simularRed({
    ...orientacion,
    url: URL_REPOSITORIO,
    procedimiento: [...orientacion.procedimiento],
    requisitos: [...orientacion.requisitos],
    formatos: [...orientacion.formatos],
    metadatos: [...orientacion.metadatos],
  });
}

function leerBloques(body: string) {
  const bloques: Record<'procedimiento' | 'requisitos' | 'formatos' | 'metadatos', string[]> = {
    procedimiento: [], requisitos: [], formatos: [], metadatos: [],
  };
  const titulos = new Map<string, keyof typeof bloques>([
    ['## Procedimiento', 'procedimiento'],
    ['## Requisitos', 'requisitos'],
    ['## Formatos', 'formatos'],
    ['## Metadatos', 'metadatos'],
  ]);
  const vistos = new Set<keyof typeof bloques>();
  let actual: string[] | undefined;
  for (const linea of body.split(/\r?\n/).map((texto) => texto.trimEnd())) {
    if (!linea.trim()) continue;
    const titulo = titulos.get(linea);
    if (titulo) {
      if (vistos.has(titulo)) return;
      vistos.add(titulo);
      actual = bloques[titulo];
    } else {
      if (!actual || !linea.startsWith('- ') || !linea.slice(2).trim()) return;
      actual.push(linea.slice(2).trim());
    }
  }
  if (Object.values(bloques).every((items) => items.length > 0)) return bloques;
}
