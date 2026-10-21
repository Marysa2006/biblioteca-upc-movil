/**
 * Guías de la biblioteca para leer sin conexión (HU-29, función plus).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 *
 * Son contenidos publicados por la biblioteca (HU-04) que la app guarda en el celular.
 * La app guarda el texto; el Backend sigue siendo la fuente de la versión nueva.
 */

/** Guía publicada de la biblioteca (HU-29). */
export type Guia = {
  id: string;
  titulo: string;
  descripcion: string;
  /** Cuerpo de la guía, en texto plano. */
  contenido: string;
  /** Última actualización, 'AAAA-MM-DD'. Sirve para saber si hay versión nueva (CA3). */
  actualizada: string;
  /** Solo las publicadas se ofrecen a la comunidad (CA1). */
  publicado: boolean;
};

/** Guía guardada en el celular para leerla sin conexión (CA2). */
export type GuiaGuardada = {
  guia: Guia;
  /** Cuándo se guardó, en milisegundos. */
  guardadaEn: number;
};
