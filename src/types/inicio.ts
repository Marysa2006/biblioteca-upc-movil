/**
 * Fotos del carrusel de Inicio (#290, versión 1.1).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 *
 * La biblioteca las administra desde Gestión → Portal → Fotos de Inicio; antes iban dentro del
 * APK (#164). El recurso del Backend todavía no existe: los nombres de los campos son
 * provisionales.
 */

/** Una foto del carrusel de Inicio. */
export type FotoInicio = {
  id: string;
  /**
   * URL de la imagen, la que sirve el Backend. Las fotos que trae la app se nombran
   * `app://<nombre>` (ver `fuenteFotoInicio()` en src/utils/inicio.ts).
   */
  imagen: string;
  /** Qué muestra la foto. Obligatoria: la lee el lector de pantalla. */
  descripcion: string;
  /** Posición en el carrusel: 1 es la primera. */
  orden: number;
  /** Solo las publicadas se ven en Inicio. */
  publicada: boolean;
};
