/**
 * Paginación de las listas largas (#161), en la pantalla: la API y los hooks siguen trayendo
 * toda la lista. Cuando el Backend acepte el parámetro `pagina`, esto pasa a la API.
 */

/** Cuántos elementos se muestran por página. */
export const POR_PAGINA = 10;

export type Pagina<T> = {
  /** Los elementos de la página pedida. */
  elementos: T[];
  /** Cuántos elementos tiene la lista completa. */
  total: number;
  /** Cuántas páginas hay; al menos 1, aunque la lista esté vacía. */
  paginas: number;
  /** La página que se muestra (1, 2…): si la pedida no existe, la más cercana. */
  pagina: number;
};

/**
 * Corta la lista en la página pedida (empieza en 1). Si la página ya no existe, por ejemplo
 * porque la lista se achicó al aprobar una solicitud, devuelve la última.
 */
export function paginar<T>(lista: T[], pagina: number, porPagina = POR_PAGINA): Pagina<T> {
  const total = lista.length;
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const actual = Math.min(Math.max(1, Math.floor(pagina) || 1), paginas);
  const inicio = (actual - 1) * porPagina;
  return { elementos: lista.slice(inicio, inicio + porPagina), total, paginas, pagina: actual };
}
