/** Funciones puras de texto. */

/** Para buscar sin importar mayúsculas ni tildes: "Pérez" → "perez". */
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}
