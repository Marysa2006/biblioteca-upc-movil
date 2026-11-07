/**
 * Orientación de autoarchivo (HU-11): procedimiento, requisitos, formatos y metadatos para
 * depositar un trabajo de grado en el Repositorio Institucional. Solo orienta: el depósito se
 * hace en el repositorio (ver ./repositorio).
 * La ruta es provisional: confírmenla con el equipo de Backend.
 */
import { peticion, simularRed, USAR_MOCKS } from './cliente';
import { ORIENTACION_AUTOARCHIVO } from './mocks/autoarchivo';

/**
 * Contenido de la orientación. Es un tipo de contenido de esta capa, no va en src/types.
 * Cada bloque es una lista para que la pantalla la pinte como tal.
 */
export type OrientacionAutoarchivo = {
  titulo: string;
  /** Fecha de la última actualización, 'AAAA-MM-DD'. */
  actualizada: string;
  /** Pasos del procedimiento, en orden. */
  procedimiento: string[];
  requisitos: string[];
  formatos: string[];
  metadatos: string[];
};

/** La orientación completa, con sus cuatro bloques (HU-11, CA1). */
export function obtenerOrientacionAutoarchivo(): Promise<OrientacionAutoarchivo> {
  if (USAR_MOCKS) {
    const orientacion = ORIENTACION_AUTOARCHIVO;
    return simularRed({
      ...orientacion,
      procedimiento: [...orientacion.procedimiento],
      requisitos: [...orientacion.requisitos],
      formatos: [...orientacion.formatos],
      metadatos: [...orientacion.metadatos],
    });
  }
  return peticion<OrientacionAutoarchivo>('/autoarchivo/');
}
