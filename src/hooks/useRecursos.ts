/**
 * Hook de los recursos académicos (HU-03).
 * La pantalla (María, #14) solo usa este hook: no llama a la API ni a los mocks.
 */
import { useQuery } from '@tanstack/react-query';

import { obtenerRecursos } from '@/api/recursos';

export function useRecursos() {
  return useQuery({
    queryKey: ['recursos'],
    queryFn: obtenerRecursos,
  });
}
