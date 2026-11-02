/**
 * Lo común a las búsquedas del Catálogo: Koha (src/utils/catalogo.ts) y el repositorio
 * DSpace (src/utils/repositorio.ts) devuelven sus resultados con esta misma forma, así que
 * se muestran con los mismos componentes. Funciones puras.
 */

/** Un resultado: un libro de Koha o un trabajo del repositorio. */
export type ResultadoBusqueda = {
  /** biblionumber de Koha o uuid de DSpace. */
  id: string;
  titulo: string;
  /** Uno o varios, separados por "; ". Vacío si el registro no lo trae. */
  autor: string;
  /** Año de publicación, o vacío si no se reconoce. */
  anio: string;
  /** Página del resultado en su sistema (ficha del OPAC o ítem del repositorio). */
  url: string;
};

/** Una página de resultados. */
export type PaginaResultados = {
  resultados: ResultadoBusqueda[];
  /** Total de resultados de la búsqueda, en todas las páginas. */
  total: number;
  /** Lo que se pide para traer la página siguiente, o null si no hay más. */
  siguiente: number | null;
};

/** Cuántos resultados trae cada página: lo que da Koha, y lo mismo se le pide a DSpace. */
export const RESULTADOS_POR_PAGINA = 20;

/** "1.681 resultados para «derecho»", con el punto de miles. */
export function textoResultados(total: number, texto: string): string {
  const cantidad = String(total).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cantidad} ${total === 1 ? 'resultado' : 'resultados'} para «${texto.trim()}»`;
}
