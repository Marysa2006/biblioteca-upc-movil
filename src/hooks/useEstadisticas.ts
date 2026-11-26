/**
 * Hooks de estadísticas (HU-25 y HU-26).
 *
 *   const { data: registros, isPending, isError, refetch } = useRegistrosUso(filtros);
 */
import { useMutation, useQuery } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import { obtenerRegistrosUso, obtenerResumenEstadistico } from '@/api/estadisticas';
import { usaApi } from '@/api/cliente';
import type { FiltrosEstadisticas, IndicadoresUso } from '@/types';
import { calcularIndicadores, HORAS_REFERENCIA_TABLET } from '@/utils/estadisticas';
import { exportarBinarioBackend, exportarCsvBackend, exportarRegistrosCsv } from '@/utils/exportarEstadisticas';
import { exportarPdf } from '@/utils/exportarPdf';

import { useParametros } from './useParametros';

/** Registros de uso con los filtros de HU-26 (HU-25, CA3). */
export function useRegistrosUso(filtros: FiltrosEstadisticas = {}) {
  return useQuery({
    queryKey: claves.registrosUso(filtros),
    queryFn: () => obtenerRegistrosUso(filtros),
    enabled: !usaApi('estadisticas'),
  });
}

/**
 * Indicadores de uso (HU-26, CA1). Se calculan en el celular a partir de los registros que ya
 * trae la consulta: así los gráficos y la exportación usan exactamente los mismos datos.
 * La duración de referencia de las tablets sale de los parámetros (#307): si la biblioteca la
 * cambia, el cumplimiento se recalcula.
 */
export function useIndicadores(filtros: FiltrosEstadisticas = {}, enabled = true) {
  const parametros = useParametros();
  const conApi = usaApi('estadisticas');
  const horasReferenciaTablet = conApi ? undefined : parametros.data?.horasPrestamoTablet ?? HORAS_REFERENCIA_TABLET;
  return useQuery({
    queryKey: [...claves.indicadoresUso(filtros), horasReferenciaTablet],
    enabled,
    queryFn: async () =>
      usaApi('estadisticas')
        ? obtenerResumenEstadistico(filtros)
        : calcularIndicadores(await obtenerRegistrosUso(filtros), { horasReferenciaTablet }),
  });
}

/**
 * Exporta los indicadores que se están viendo a PDF, con los filtros aplicados, y abre el menú
 * para compartirlo (#260).
 */
export function useExportarPdf() {
  return useMutation({
    mutationFn: ({
      indicadores,
      filtros,
    }: {
      indicadores: IndicadoresUso;
      filtros: FiltrosEstadisticas;
    }) => usaApi('estadisticas') ? exportarBinarioBackend(filtros, 'pdf') : exportarPdf(indicadores, filtros),
  });
}

/** Exporta los registros que se están viendo a un CSV y abre el menú para compartirlo. */
export function useExportarEstadisticas() {
  return useMutation({
    mutationFn: ({
      registros,
      filtros,
      indicadores,
    }: {
      registros: Parameters<typeof exportarRegistrosCsv>[0];
      filtros: FiltrosEstadisticas;
      indicadores: IndicadoresUso;
    }) =>
      usaApi('estadisticas')
        ? exportarCsvBackend(filtros, indicadores)
        : exportarRegistrosCsv(registros, indicadores),
  });
}

export function useExportarXlsx() {
  return useMutation({ mutationFn: (filtros: FiltrosEstadisticas) => exportarBinarioBackend(filtros, 'xlsx') });
}
