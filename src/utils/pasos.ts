/**
 * Solicitudes de la comunidad por pasos (#251): Solicitud · Tus datos · Términos en la asesoría,
 * la capacitación y la reserva, con PasosFormulario. "Siguiente" valida solo los campos de ese
 * paso; si "Enviar" falla por la validación, el formulario vuelve al primer paso con errores y, en
 * iOS, anuncia el primer mensaje (en Android lo anuncia accessibilityLiveRegion bajo cada campo).
 * Funciones puras: reciben el mapa de cada campo a su paso y los errores de react-hook-form
 * (`formState.errors`).
 */

/** Los campos de un paso, para validarlos con `trigger()` antes de avanzar. */
export function camposDelPaso<C extends string, P extends string>(
  pasoDe: Record<C, P>,
  paso: P,
): C[] {
  return (Object.keys(pasoDe) as C[]).filter((campo) => pasoDe[campo] === paso);
}

/** El primer paso, en su orden, que tiene algún campo con error. */
export function primerPasoConError<C extends string, P extends string>(
  errores: object,
  pasoDe: Record<C, P>,
  orden: readonly P[],
): P | undefined {
  const conError = Object.keys(errores) as C[];
  return orden.find((paso) => conError.some((campo) => pasoDe[campo] === paso));
}

/**
 * El mensaje del primer campo con error, en el orden en que se ven los campos. Un campo que es
 * una lista (por ejemplo, los participantes) da el mensaje de su primer elemento con error.
 */
export function primerMensajeDeError(
  errores: object,
  campos: readonly string[],
): string | undefined {
  const porCampo = errores as Record<string, unknown>;
  for (const campo of campos) {
    const error = porCampo[campo];
    if (error == null) continue;
    const lista = Array.isArray(error) ? error : [error];
    const mensaje = lista
      .map((elemento) => (elemento as { message?: unknown } | undefined)?.message)
      .find((texto): texto is string => typeof texto === 'string' && texto !== '');
    if (mensaje) return mensaje;
  }
  return undefined;
}
