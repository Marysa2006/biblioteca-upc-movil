/**
 * Mensajes de error para mostrar en pantalla. Funciones puras, sin hooks.
 * Las pantallas no importan de src/api: se lee el código del error (ErrorApi.estado) sin la clase.
 */

/** El mensaje de la API si es de validación (400) o "no existe" (404); si no, uno general. */
export function mensajeErrorGuardar(error: Error): string {
  if ('estado' in error && (error.estado === 400 || error.estado === 404)) {
    return error.message;
  }
  return 'No pudimos guardar los cambios. Revisa tu conexión e inténtalo de nuevo.';
}
