/**
 * Hooks de parámetros generales (HU-28).
 * Consultan y actualizan periodos, festivos, horarios y plazos.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import { actualizarParametros, obtenerParametros } from '@/api/parametros';
import type { Parametros } from '@/types';

const CLAVE = claves.parametros;

export function useParametros() {
  return useQuery({
    queryKey: CLAVE,
    queryFn: obtenerParametros,
  });
}

export function useActualizarParametros() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (valor: Parametros) => actualizarParametros(valor),
    onSuccess: (valor) => {
      queryClient.setQueryData(CLAVE, valor);
      queryClient.invalidateQueries({ queryKey: CLAVE });
      // Festivos, horarios y anticipación cambian qué franjas se ofrecen (HU-17).
      queryClient.invalidateQueries({ queryKey: claves.disponibilidadTodas });
    },
  });
}
