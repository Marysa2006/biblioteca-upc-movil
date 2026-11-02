/**
 * Lectura de los resultados del repositorio institucional (DSpace 7). Funciones puras, sin red.
 *
 * La búsqueda pública de DSpace (/server/api/discover/search/objects) responde JSON (HAL).
 * De cada trabajo se toman el título, los autores (dc.contributor.author) y el año de
 * dc.date.issued; lo que no venga se deja vacío. La url es la página del trabajo en el
 * repositorio, donde están el resumen y el archivo.
 */
import type { PaginaResultados, ResultadoBusqueda } from '@/utils/busqueda';

type Metadato = { value?: unknown };

type ObjetoDSpace = {
  uuid?: unknown;
  name?: unknown;
  metadata?: Record<string, Metadato[] | undefined>;
};

type RespuestaDSpace = {
  _embedded?: {
    searchResult?: {
      page?: { number?: unknown; totalPages?: unknown; totalElements?: unknown };
      _embedded?: { objects?: { _embedded?: { indexableObject?: ObjetoDSpace } }[] };
    };
  };
};

/** Los valores de texto de un metadato, sin espacios de más. */
function valores(objeto: ObjetoDSpace, campo: string): string[] {
  return (objeto.metadata?.[campo] ?? [])
    .map((metadato) => (typeof metadato.value === 'string' ? metadato.value : ''))
    .map((valor) => valor.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** Un trabajo del repositorio, o null si no trae su uuid o su título. */
function leerObjeto(objeto: ObjetoDSpace, urlBase: string): ResultadoBusqueda | null {
  const id = typeof objeto.uuid === 'string' ? objeto.uuid : '';
  const nombre = typeof objeto.name === 'string' ? objeto.name : '';
  // Quita la puntuación final que traen muchos títulos ("…de Rafael Carrillo Luquez.").
  const titulo = (valores(objeto, 'dc.title')[0] ?? nombre).replace(/[\s.,;:]+$/, '').trim();
  if (!id || !titulo) return null;

  const fecha = valores(objeto, 'dc.date.issued')[0] ?? '';
  return {
    id,
    titulo,
    // Algunos registros traen cada autor aparte y otros todos en un valor, ya con "; ".
    autor: valores(objeto, 'dc.contributor.author').join('; '),
    anio: /^\d{4}/.test(fecha) ? fecha.slice(0, 4) : '',
    url: `${urlBase}/items/${id}`,
  };
}

/**
 * Convierte la respuesta de la búsqueda de DSpace en una página de resultados.
 * `siguiente` es el número de la página siguiente (DSpace cuenta las páginas desde 0).
 * Lanza un error si la respuesta no es una búsqueda.
 */
export function leerResultadosRepositorio(respuesta: unknown, urlBase: string): PaginaResultados {
  const busqueda = (respuesta as RespuestaDSpace | null)?._embedded?.searchResult;
  if (!busqueda?.page) {
    throw new Error('El repositorio no devolvió resultados de búsqueda.');
  }

  const numero = Number(busqueda.page.number) || 0;
  const paginas = Number(busqueda.page.totalPages) || 0;
  const resultados = (busqueda._embedded?.objects ?? [])
    .map((objeto) => objeto._embedded?.indexableObject)
    .filter((objeto): objeto is ObjetoDSpace => objeto != null)
    .map((objeto) => leerObjeto(objeto, urlBase))
    .filter((trabajo): trabajo is ResultadoBusqueda => trabajo !== null);

  return {
    resultados,
    total: Number(busqueda.page.totalElements) || 0,
    siguiente: numero + 1 < paginas ? numero + 1 : null,
  };
}
