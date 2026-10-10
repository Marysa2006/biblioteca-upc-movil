/**
 * EJEMPLO DE REFERENCIA del patrón de datos: pantalla → hook → función de API → mock.
 * Copien esta forma para cada HU de datos.
 *
 * La ruta '/servicios/' es provisional: confírmenla con el equipo de Backend.
 */
import type { Servicio } from '@/types';

import { peticion, simularRed, USAR_MOCKS } from './cliente';
import { SERVICIOS } from './mocks/servicios';

export function obtenerServicios(): Promise<Servicio[]> {
  if (USAR_MOCKS) {
    return simularRed(SERVICIOS.filter((servicio) => servicio.activo));
  }
  return peticion<Servicio[]>('/servicios/');
}
