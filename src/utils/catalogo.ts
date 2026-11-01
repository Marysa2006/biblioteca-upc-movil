/**
 * Lectura de los resultados del catálogo de Koha (HU-02). Funciones puras, sin red.
 *
 * Koha devuelve la búsqueda del OPAC en RSS (opac-search.pl?format=rss). Los registros de
 * la biblioteca vienen escritos a mano y con formatos distintos, así que cada campo se lee
 * con cuidado y, si no se reconoce, se deja vacío en lugar de mostrar texto roto.
 * La url de cada resultado es su ficha del OPAC: allí se ven los ejemplares y su disponibilidad.
 */
import type { PaginaResultados, ResultadoBusqueda } from '@/utils/busqueda';

const ENTIDADES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

/** Convierte &amp;, &#233; y &#xE9; en sus caracteres. */
function decodificarEntidades(texto: string): string {
  return texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entidad, codigo: string) => {
    if (codigo.startsWith('#x') || codigo.startsWith('#X')) {
      return String.fromCodePoint(parseInt(codigo.slice(2), 16));
    }
    if (codigo.startsWith('#')) return String.fromCodePoint(parseInt(codigo.slice(1), 10));
    return ENTIDADES[codigo.toLowerCase()] ?? entidad;
  });
}

/** Texto plano: sin CDATA ni etiquetas, con las entidades resueltas y un solo espacio. */
function textoPlano(texto: string): string {
  const sinCdata = texto.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  const sinEtiquetas = sinCdata.replace(/<[^>]+>/g, ' ');
  return decodificarEntidades(sinEtiquetas).replace(/\s+/g, ' ').trim();
}

/** Contenido de la primera etiqueta con ese nombre, o vacío. */
function etiqueta(xml: string, nombre: string): string {
  const coincidencia = xml.match(new RegExp(`<${nombre}[^>]*>([\\s\\S]*?)</${nombre}>`));
  return coincidencia ? coincidencia[1] : '';
}

/** Quita la puntuación de catalogación del final ("Título :", "Autor ."). */
function sinPuntuacionFinal(texto: string): string {
  return texto.replace(/[\s:;,/.=]+$/, '').trim();
}

/**
 * Autor y año desde la descripción, por ejemplo
 * "By García Márquez, Gabriel, 1927-2014.. Bogotá: Grupo Editorial Norma,2012 . 246 páginas".
 * El autor va después de "By" (o "Por", si el OPAC está en español) hasta el primer punto;
 * se le quitan sus años de nacimiento y muerte. El año de publicación es el que va antes
 * del " . " que cierra la editorial.
 */
function autorYAnio(descripcion: string): { autor: string; anio: string } {
  let autor = '';
  let resto = descripcion;

  const conAutor = descripcion.match(/^(?:By|Por)\s+(.+?)\.(?:\s|\.|$)/);
  if (conAutor) {
    // Varios autores llegan como "Celeita Reyes, Lola | Pardo Abril, Neyla"; el rol, como "(autor)".
    autor = conAutor[1]
      .split('|')
      .map((nombre) =>
        sinPuntuacionFinal(
          nombre.replace(/\([^)]*\)/g, '').replace(/[\s,.]*\d{4}(-\d{0,4})?[.\s]*$/, ''),
        ),
      )
      .filter(Boolean)
      .join('; ');
    resto = descripcion.slice(conAutor[0].length);
  }

  const conAnio = resto.match(/\b(1[5-9]\d{2}|20\d{2})\s*\./);
  return { autor, anio: conAnio ? conAnio[1] : '' };
}

/** Un <item> del RSS, o null si no trae el número del registro o el título. */
function leerItem(item: string, urlBase: string): ResultadoBusqueda | null {
  const enlace = textoPlano(etiqueta(item, 'link'));
  const id = enlace.match(/biblionumber=(\d+)/)?.[1];
  const titulo = sinPuntuacionFinal(textoPlano(etiqueta(item, 'title')));
  if (!id || !titulo) return null;

  // La descripción trae HTML (a veces escapado). Solo el primer párrafo: el segundo es
  // el enlace "Place hold on…".
  const descripcion = etiqueta(item, 'description').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const parrafo = etiqueta(descripcion, 'p');
  const { autor, anio } = autorYAnio(textoPlano(parrafo));

  return {
    id,
    titulo,
    autor,
    anio,
    url: enlace.startsWith('http') ? enlace : `${urlBase}${enlace}`,
  };
}

/**
 * Convierte la respuesta RSS de Koha en una página de resultados.
 * Lanza un error si la respuesta no es el RSS de una búsqueda (por ejemplo, una página de error).
 */
export function leerResultadosCatalogo(xml: string, urlBase: string): PaginaResultados {
  const totalTexto = etiqueta(xml, 'opensearch:totalResults');
  if (!xml.includes('<rss') || totalTexto === '') {
    throw new Error('Koha no devolvió resultados de búsqueda.');
  }

  const total = Number(textoPlano(totalTexto)) || 0;
  const inicio = Number(textoPlano(etiqueta(xml, 'opensearch:startIndex'))) || 0;
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const resultados = items
    .map((item) => leerItem(item, urlBase))
    .filter((libro): libro is ResultadoBusqueda => libro !== null);

  const siguiente = inicio + items.length;
  return { resultados, total, siguiente: items.length > 0 && siguiente < total ? siguiente : null };
}
