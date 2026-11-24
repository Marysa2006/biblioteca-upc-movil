/**
 * Hook de los recursos académicos (HU-03).
 * La pantalla (María, #14) solo usa este hook: no llama a la API ni a los mocks.
 */
import { useQuery } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import { obtenerRecursos, RECURSOS_CON_API } from '@/api/recursos';
import { useSesion } from '@/store/sesion';

export function useRecursos() {
  const hidratada = useSesion((estado) => estado.hidratada);
  const usuarioId = useSesion((estado) => (estado.token ? estado.usuario?.id : undefined));
  return useQuery({
    queryKey:
      RECURSOS_CON_API && usuarioId ? claves.recursosPorUsuario(usuarioId) : claves.recursos,
    queryFn: obtenerRecursos,
    enabled: !RECURSOS_CON_API || hidratada,
  });
}
