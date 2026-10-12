/**
 * EJEMPLO DE REFERENCIA del patrón de datos: pantalla → hook → función de API → mock.
 * Copien esta forma para cada HU de datos.
 *
 * La ruta '/servicios/' es provisional: confírmenla con el equipo de Backend.
 */
import type { Servicio } from '@/types';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { SERVICIOS } from './mocks/servicios';

export function obtenerServicios(): Promise<Servicio[]> {
  if (USAR_MOCKS) {
    return simularRed(SERVICIOS.filter((servicio) => servicio.activo));
  }
  return peticion<Servicio[]>('/servicios/');
}

/** Detalle de un servicio (HU-01). Falla con ErrorApi 404 si no existe o está inactivo. */
export function obtenerServicio(id: string): Promise<Servicio> {
  if (USAR_MOCKS) {
    const servicio = SERVICIOS.find((s) => s.id === id && s.activo);
    if (!servicio) {
      return Promise.reject(new ErrorApi(404, `No existe el servicio ${id}`));
    }
    return simularRed(servicio);
  }
  return peticion<Servicio>(`/servicios/${id}/`);
}