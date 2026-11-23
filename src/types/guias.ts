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

  // ── Versión 1.1: guías que publica la biblioteca (#258) ────
  /**
   * Enlace al documento (PDF o Drive), cuando la guía no está escrita dentro de la app.
   * `contenido` queda para las guías que sí se escriben aquí.
   */
  enlace?: string;
  /** Sede de la biblioteca a la que aplica la guía. */
  sede?: string;

  // ── Versión 1.1: guías en PDF sin conexión (#303) ────
  /**
   * El PDF de la guía, cuando la biblioteca lo sube en vez de escribirla o pegar un enlace. La app
   * lo descarga al celular y lo abre con el visor del sistema, también sin conexión.
   */
  archivo?: ArchivoGuia;
};

/** El PDF de una guía (#303). */
export type ArchivoGuia = {
  /** De dónde se descarga: la URL que da el Backend (en los datos de prueba, una ruta local). */
  url: string;
  /** Nombre del archivo, para mostrarlo; por ejemplo «guia-apa.pdf». */
  nombre: string;
  /** Tamaño en bytes. */
  bytes: number;
};

/** Guía guardada en el celular para leerla sin conexión (CA2). */
export type GuiaGuardada = {
  guia: Guia;
  /** Cuándo se guardó, en milisegundos. */
  guardadaEn: number;
};
