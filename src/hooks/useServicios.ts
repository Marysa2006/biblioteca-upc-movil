/**
 * EJEMPLO DE REFERENCIA de un hook de datos.
 * La pantalla solo conoce este hook: no sabe si los datos vienen del mock o de la API.
 */
import { useQuery } from '@tanstack/react-query';

import { obtenerServicios } from '@/api/servicios';

export function useServicios() {
  return useQuery({
    queryKey: ['servicios'],
    queryFn: obtenerServicios,
  });
}
