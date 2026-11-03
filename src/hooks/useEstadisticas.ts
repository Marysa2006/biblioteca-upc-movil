/**
 * Hooks de estadísticas (HU-25 y HU-26).
 *
 *   const { data: registros, isPending, isError, refetch } = useRegistrosUso(filtros);
 */
import { useQuery } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import { obtenerRegistrosUso } from '@/api/estadisticas';
import type { FiltrosEstadisticas } from '@/types';

/** Registros de uso con los filtros de HU-26 (HU-25, CA3). */
export function useRegistrosUso(filtros: FiltrosEstadisticas = {}) {
  return useQuery({
    queryKey: claves.registrosUso(filtros),
    queryFn: () => obtenerRegistrosUso(filtros),
  });
}
