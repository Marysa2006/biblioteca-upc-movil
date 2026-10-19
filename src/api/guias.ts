/**
 * Guías de la biblioteca (HU-29, función plus).
 * Solo se ofrecen las guías publicadas (CA1). La app las guarda en el celular para
 * leerlas sin conexión; la versión nueva la sigue publicando el Backend.
 * Las rutas son provisionales: confírmenlas con el equipo de Backend.
 */
import type { Guia } from '@/types';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { GUIAS } from './mocks/guias';

/** Guías publicadas, para la sección de guías de la comunidad (CA1). */
export function obtenerGuias(): Promise<Guia[]> {
  if (USAR_MOCKS) {
    return simularRed(GUIAS.filter((guia) => guia.publicado).map((guia) => ({ ...guia })));
  }
  return peticion<Guia[]>('/guias/');
}

/** Detalle de una guía publicada. Falla con 404 si no existe o no está publicada. */
export function obtenerGuia(id: string): Promise<Guia> {
  if (USAR_MOCKS) {
    const guia = GUIAS.find((g) => g.id === id && g.publicado);
    if (!guia) {
      return Promise.reject(new ErrorApi(404, `No existe la guía ${id}`));
    }
    return simularRed({ ...guia });
  }
  return peticion<Guia>(`/guias/${id}/`);
}
