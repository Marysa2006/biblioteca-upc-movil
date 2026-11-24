/**
 * Recursos académicos (HU-03): bases de datos suscritas y de acceso abierto.
 * El portal agrupa las fuentes por categoría y reserva los enlaces protegidos para la sesión.
 */
import type { Recurso } from '@/types';

import { recursosDesdePortal, type RecursosPortal } from './backend/portal';
import { peticion, simularRed, usaApi } from './cliente';
import { RECURSOS } from './mocks/recursos';

export const RECURSOS_CON_API = usaApi('recursos');

export async function obtenerRecursos(): Promise<Recurso[]> {
  if (!RECURSOS_CON_API) return simularRed(RECURSOS);
  return recursosDesdePortal(await peticion<RecursosPortal>('/portal/resources/'));
}
