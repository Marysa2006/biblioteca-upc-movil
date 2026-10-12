/**
 * Recursos académicos (HU-03): bases de datos suscritas y de acceso abierto.
 * Mismo patrón que src/api/servicios.ts: pantalla → hook → función → mock.
 *
 * La ruta '/recursos/' es provisional: confírmenla con el equipo de Backend.
 */
import type { Recurso } from '@/types';

import { peticion, simularRed, USAR_MOCKS } from './cliente';
import { RECURSOS } from './mocks/recursos';

export function obtenerRecursos(): Promise<Recurso[]> {
  if (USAR_MOCKS) {
    return simularRed(RECURSOS);
  }
  return peticion<Recurso[]>('/recursos/');
}
