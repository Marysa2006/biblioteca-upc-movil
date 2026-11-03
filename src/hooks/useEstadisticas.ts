/**
 * Hooks de estadísticas (HU-25 y HU-26).
 *
 *   const { data: registros, isPending, isError, refetch } = useRegistrosUso(filtros);
 */
import { useMutation, useQuery } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import { obtenerRegistrosUso } from '@/api/estadisticas';
import type { FiltrosEstadisticas } from '@/types';
import { calcularIndicadores } from '@/utils/estadisticas';
import { exportarRegistrosCsv } from '@/utils/exportarEstadisticas';

/** Registros de uso con los filtros de HU-26 (HU-25, CA3). */
export function useRegistrosUso(filtros: FiltrosEstadisticas = {}) {
  return useQuery({
    queryKey: claves.registrosUso(filtros),
    queryFn: () => obtenerRegistrosUso(filtros),
  });
}

/**
 * Indicadores de uso (HU-26, CA1). Se calculan en el celular a partir de los registros que ya
 * trae la consulta: así los gráficos y la exportación usan exactamente los mismos datos.
 */
export function useIndicadores(filtros: FiltrosEstadisticas = {}) {
  return useQuery({
    queryKey: claves.indicadoresUso(filtros),
    queryFn: async () => calcularIndicadores(await obtenerRegistrosUso(filtros)),
  });
}

/** Exporta los registros que se están viendo a un CSV y abre el menú para compartirlo. */
export function useExportarEstadisticas() {
  return useMutation({
    mutationFn: (registros: Parameters<typeof exportarRegistrosCsv>[0]) =>
      exportarRegistrosCsv(registros),
  });
}
