/**
 * Mensajes de error para mostrar en pantalla. Funciones puras, sin hooks.
 * Las pantallas no importan de src/api: se lee el código del error (ErrorApi.estado) sin la clase.
 */

/** El mensaje de la API para validación, recurso inexistente o conflicto. */
export function mensajeErrorGuardar(error: Error): string {
  if ('estado' in error && (error.estado === 400 || error.estado === 404 || error.estado === 409)) {
    return error.message;
  }
  return 'No pudimos guardar los cambios. Revisa tu conexión e inténtalo de nuevo.';
}
