/**
 * Calificación de la calidad del servicio (versión 1.1, #254): una asesoría o una capacitación
 * realizada se califica una sola vez, de 1 a 5, con un comentario opcional. Funciones puras,
 * sin hooks: las usan la API (asesorías y capacitaciones) y, si quiere, el formulario.
 */
import type { Calificacion } from '@/types';
import { hoyISO } from '@/utils/fechas';

export const PUNTAJE_MINIMO = 1;
export const PUNTAJE_MAXIMO = 5;
export const LARGO_MAXIMO_COMENTARIO = 500;

/** Lo que manda la persona al calificar. */
export type DatosCalificacion = {
  puntaje: number;
  comentario?: string;
};

/** El puntaje es un entero de 1 a 5 y el comentario, si viene, tiene máximo 500 caracteres. */
export function problemaCalificacion(datos: DatosCalificacion): string | null {
  const { puntaje } = datos;
  if (!Number.isInteger(puntaje) || puntaje < PUNTAJE_MINIMO || puntaje > PUNTAJE_MAXIMO) {
    return `Elige un puntaje de ${PUNTAJE_MINIMO} a ${PUNTAJE_MAXIMO}.`;
  }
  if (datos.comentario != null && typeof datos.comentario !== 'string') {
    return 'Escribe el comentario como texto.';
  }
  if ((datos.comentario?.trim().length ?? 0) > LARGO_MAXIMO_COMENTARIO) {
    return `El comentario no puede pasar de ${LARGO_MAXIMO_COMENTARIO} caracteres.`;
  }
  return null;
}

/** La calificación que se guarda en la solicitud, con la fecha de hoy; sin comentario vacío. */
export function crearCalificacion(datos: DatosCalificacion, fecha = hoyISO()): Calificacion {
  const comentario = datos.comentario?.trim();
  return { puntaje: datos.puntaje, ...(comentario ? { comentario } : {}), fecha };
}

/** Nota del evento del historial (HU-08). */
export function notaCalificacion(puntaje: number): string {
  return `Calificaste el servicio con ${puntaje} de ${PUNTAJE_MAXIMO}.`;
}

/** Mensaje de la invitación a calificar que llega al marcar el servicio como realizado. */
export const MENSAJE_INVITACION_CALIFICAR =
  'Califícala desde Mis solicitudes. Tu opinión nos ayuda a mejorar.';

/** Nombre de cada puntaje, para leerlo en texto y no solo en estrellas (#255). */
export const NOMBRE_PUNTAJE: Record<number, string> = {
  1: 'Malo',
  2: 'Regular',
  3: 'Bueno',
  4: 'Muy bueno',
  5: 'Excelente',
};

/** "4 de 5, Muy bueno". */
export function textoPuntaje(puntaje: number): string {
  const nombre = NOMBRE_PUNTAJE[puntaje];
  return `${puntaje} de ${PUNTAJE_MAXIMO}${nombre ? `, ${nombre}` : ''}`;
}

/**
 * Si la persona puede calificarla (#255): realizada, sin calificar y sin inasistencia. Es la
 * misma regla de calificarCita() y calificarCapacitacion(); la API sigue siendo la que decide.
 */
export function porCalificar(solicitud: {
  estado: string;
  calificacion?: unknown;
  asistio?: boolean;
}): boolean {
  return solicitud.estado === 'realizada' && !solicitud.calificacion && solicitud.asistio !== false;
}
