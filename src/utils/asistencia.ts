/**
 * Contenido del QR de asistencia (HU-32 y HU-33). Funciones puras: el facilitador arma el
 * texto del QR y la app de quien escanea lo lee. El QR lleva la sesión y el código, así un
 * código no sirve para registrarse en otra sesión.
 *
 *   biblioupc:asistencia:<sesionId>:<codigo>
 */

export const PREFIJO_QR_ASISTENCIA = 'biblioupc:asistencia:';

/** Lo que trae un QR de asistencia. */
export type DatosQrAsistencia = {
  sesionId: string;
  codigo: string;
};

/**
 * El texto del QR de una sesión. La pantalla del facilitador dibuja esto, no solo el código:
 *   armarCodigoAsistencia(codigo.sesionId, codigo.codigo)
 */
export function armarCodigoAsistencia(sesionId: string, codigo: string): string {
  return `${PREFIJO_QR_ASISTENCIA}${encodeURIComponent(sesionId)}:${encodeURIComponent(codigo)}`;
}

/** La sesión y el código de un texto escaneado; null si no es un QR de asistencia. Nunca lanza. */
export function leerCodigoAsistencia(texto: string): DatosQrAsistencia | null {
  const limpio = texto?.trim() ?? '';
  if (!limpio.startsWith(PREFIJO_QR_ASISTENCIA)) return null;

  const resto = limpio.slice(PREFIJO_QR_ASISTENCIA.length);
  const separador = resto.lastIndexOf(':');
  if (separador === -1) return null;

  try {
    const sesionId = decodeURIComponent(resto.slice(0, separador)).trim();
    const codigo = decodeURIComponent(resto.slice(separador + 1)).trim();
    return sesionId && codigo ? { sesionId, codigo } : null;
  } catch {
    // Un % mal formado hace fallar a decodeURIComponent: no es un QR nuestro.
    return null;
  }
}
