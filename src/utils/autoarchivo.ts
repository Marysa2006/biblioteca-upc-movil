/**
 * Funciones puras de la orientación de autoarchivo (HU-11).
 */

/**
 * Texto de un metadato para mostrarlo como etiqueta: sin espacios sobrantes ni punto final
 * ("Título del trabajo." → "Título del trabajo"). El contenido viene escrito como frase.
 */
export function textoEtiqueta(texto: string): string {
  return texto.trim().replace(/\.+$/, '');
}
