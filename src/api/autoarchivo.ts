/**
 * Orientación de autoarchivo (HU-11): procedimiento, requisitos, formatos y metadatos para
 * depositar un trabajo de grado en el Repositorio Institucional. Solo orienta: el depósito se
 * hace en el repositorio (ver ./repositorio).
 * La guía publicada se muestra aunque su contenido llegue como texto libre.
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
  actualizada?: string;
  texto?: string;
  /** Pasos del procedimiento, en orden. */
  procedimiento: string[];
  requisitos: string[];
  formatos: string[];
  metadatos: string[];
};

type AutoarchivoBackend = {
  repository_url: string | null;
  message?: string | null;
  guide: { body: string; title: string; published_at?: string | null; updated_at?: string } | null;
};

export async function obtenerPortalAutoarchivo() {
  if (!usaApi('autoarchivo')) {
    return simularRed({
      url: PORTAL_AUTOARCHIVO_PRUEBA.repository_url,
      mensaje: PORTAL_AUTOARCHIVO_PRUEBA.message,
      orientacion: ORIENTACION_AUTOARCHIVO,
    });
  }

  const { repository_url, message, guide } =
    await peticion<AutoarchivoBackend>('/portal/self-archive/');
  const cuerpo = guide?.body;
  const vacia = { procedimiento: [], requisitos: [], formatos: [], metadatos: [] };
  const orientacion: OrientacionAutoarchivo = {
    titulo: guide?.title ?? '',
    actualizada: (guide?.published_at ?? guide?.updated_at)?.slice(0, 10),
    ...(cuerpo?.trim() ? (leerBloques(cuerpo) ?? { ...vacia, texto: cuerpo }) : vacia),
  };
  return { url: repository_url ?? null, mensaje: message, orientacion };
}

function leerBloques(body: string) {
  const bloques: Record<'procedimiento' | 'requisitos' | 'formatos' | 'metadatos', string[]> = {
    procedimiento: [],
    requisitos: [],
    formatos: [],
    metadatos: [],
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
