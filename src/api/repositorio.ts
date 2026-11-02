/**
 * Búsqueda en el repositorio institucional, DSpace 7 (HU-11): trabajos de grado e
 * investigaciones de la Universidad. Usa la búsqueda pública de su API REST, que no pide cuenta.
 *
 * No usa peticion() de ./cliente: DSpace no es nuestra API y no debe recibir el token de la
 * sesión. Tampoco usa los mocks: los datos son públicos y reales.
 */
import { RESULTADOS_POR_PAGINA, type PaginaResultados } from '@/utils/busqueda';
import { URL_REPOSITORIO } from '@/utils/constantes';
import { leerResultadosRepositorio } from '@/utils/repositorio';

const TIEMPO_LIMITE_MS = 8000;

/** Página principal del repositorio. */
export function urlRepositorioPrincipal(): string {
  return URL_REPOSITORIO;
}

/** La misma búsqueda en la página del repositorio, con sus filtros. */
export function urlBusquedaRepositorio(texto: string): string {
  return `${URL_REPOSITORIO}/search?query=${encodeURIComponent(texto.trim())}`;
}

/**
 * Busca trabajos en el repositorio y devuelve una página de resultados.
 * `pagina` cuenta desde 0. Lanza un error si DSpace no responde, tarda demasiado o no
 * devuelve una búsqueda.
 */
export async function buscarEnRepositorio(texto: string, pagina = 0): Promise<PaginaResultados> {
  const parametros =
    `query=${encodeURIComponent(texto.trim())}&dsoType=ITEM` +
    `&page=${pagina}&size=${RESULTADOS_POR_PAGINA}`;
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_MS);
  try {
    const respuesta = await fetch(
      `${URL_REPOSITORIO}/server/api/discover/search/objects?${parametros}`,
      { headers: { Accept: 'application/json' }, signal: controlador.signal },
    );
    if (!respuesta.ok) {
      throw new Error(`El repositorio respondió ${respuesta.status}.`);
    }
    return leerResultadosRepositorio(await respuesta.json(), URL_REPOSITORIO);
  } finally {
    clearTimeout(temporizador);
  }
}
