/** Funciones puras de texto. */

/** Para buscar sin importar mayúsculas ni tildes: "Pérez" → "perez". */
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Nombre de persona como se escribe: "laura  PÉREZ" → "Laura Pérez" (#224). Quita los espacios
 * de sobra y conserva las tildes y la ñ. No sirve para correos ni identificaciones.
 */
export function aNombrePropio(texto: string): string {
  return texto
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (palabra) =>
        palabra.charAt(0).toLocaleUpperCase('es') + palabra.slice(1).toLocaleLowerCase('es'),
    )
    .join(' ');
}
