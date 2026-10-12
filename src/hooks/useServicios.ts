/**
 * EJEMPLO DE REFERENCIA de un hook de datos.
 * La pantalla solo conoce este hook: no sabe si los datos vienen del mock o de la API.
 */
import { useQuery } from '@tanstack/react-query';

import { obtenerServicio, obtenerServicios } from '@/api/servicios';

export function useServicios() {
  return useQuery({
    queryKey: ['servicios'],
    queryFn: obtenerServicios,
  });
}

/** Detalle de un servicio por su id. No consulta mientras el id esté vacío. */
export function useServicio(id: string) {
  return useQuery({
    queryKey: ['servicios', id],
    queryFn: () => obtenerServicio(id),
    enabled: id !== '',
  });
}