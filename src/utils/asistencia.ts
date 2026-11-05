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

/** Desde cuántos minutos antes de empezar la sesión se puede tomar la asistencia (HU-33). */
export const MINUTOS_ANTES_ASISTENCIA = 30;

/** 'AAAA-MM-DD' y 'HH:MM' → Date local. */
function momento(fecha: string, hora: string): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const [h, m] = hora.split(':').map(Number);
  return new Date(anio, mes - 1, dia, h, m);
}

/**
 * Si el facilitador puede tomar la asistencia de la cita (HU-33, CA1): la cita está aprobada y
 * es de hoy, desde 30 minutos antes de empezar hasta que termina el día.
 */
export function puedeTomarAsistencia(
  cita: { estado: string; fecha: string; horaInicio: string },
  ahora = new Date(),
): boolean {
  if (cita.estado !== 'aprobada') return false;
  const inicio = momento(cita.fecha, cita.horaInicio);
  const desde = new Date(inicio.getTime() - MINUTOS_ANTES_ASISTENCIA * 60_000);
  const finDelDia = momento(cita.fecha, '23:59');
  return ahora >= desde && ahora <= finDelDia;
}

/** Minutos que le quedan al código ('AAAA-MM-DD HH:MM'); 0 si ya venció. */
export function minutosParaVencer(vence: string, ahora = new Date()): number {
  const [fecha, hora] = vence.split(' ');
  const restante = momento(fecha, hora).getTime() - ahora.getTime();
  return Math.max(0, Math.ceil(restante / 60_000));
}

/** "Vence en 32 min", "Vence en 1 min" o "El código venció". */
export function textoVencimiento(minutos: number): string {
  if (minutos <= 0) return 'El código venció';
  return `Vence en ${minutos} min`;
}
