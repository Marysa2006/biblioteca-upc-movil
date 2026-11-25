/**
 * Orientación de autoarchivo (HU-11): procedimiento, requisitos, formatos y metadatos para
 * depositar un trabajo de grado en el Repositorio Institucional. Solo orienta: el depósito se
 * hace en el repositorio (ver ./repositorio).
 * Si el portal no publica la guía con los cuatro bloques, se usa la orientación de prueba.
 */
import { peticion, simularRed, usaApi } from './cliente';
import { ORIENTACION_AUTOARCHIVO } from './mocks/autoarchivo';
import { PORTAL_AUTOARCHIVO_PRUEBA } from './mocks/enlacesPortal';

/**
 * Contenido de la orientación. Es un tipo de contenido de esta capa, no va en src/types.
 * Cada bloque es una lista para que la pantalla la pinte como tal.
 */
export type OrientacionAutoarchivo = {
  titulo: string;
  /** Fecha de la última actualización, 'AAAA-MM-DD'. */
  actualizada: string;
  /** Pasos del procedimiento, en orden. */
  procedimiento: string[];
  requisitos: string[];
  formatos: string[];
  metadatos: string[];
};

type AutoarchivoBackend = {
  repository_url: string | null;
  message?: string | null;
  guide: { body: string; title: string; published_at?: string | null } | null;
};

export async function obtenerPortalAutoarchivo() {
  const respuesta = usaApi('autoarchivo')
    ? await peticion<AutoarchivoBackend>('/portal/self-archive/')
    : await simularRed<AutoarchivoBackend>(PORTAL_AUTOARCHIVO_PRUEBA);
  const guia = respuesta.guide;
  const bloques = typeof guia?.body === 'string' ? leerBloques(guia.body) : undefined;
  const orientacion = bloques ? {
    ...bloques,
    titulo: guia?.title || ORIENTACION_AUTOARCHIVO.titulo,
    actualizada: guia?.published_at?.slice(0, 10) || ORIENTACION_AUTOARCHIVO.actualizada,
  } : ORIENTACION_AUTOARCHIVO;

  return { url: respuesta.repository_url ?? null, mensaje: respuesta.message, orientacion };
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
