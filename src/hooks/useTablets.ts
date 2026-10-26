/**
 * Hooks del inventario de tablets (HU-21).
 * Las mutaciones refrescan las tablets y, con ellas, la disponibilidad (CA3).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import {
  cambiarEstadoTablet,
  crearTablet,
  editarTablet,
  obtenerTablets,
  type DatosTablet,
} from '@/api/tablets';
import type { EstadoTablet } from '@/types';

export function useTablets() {
  return useQuery({
    queryKey: claves.tablets,
    queryFn: obtenerTablets,
  });
}

export function useCrearTablet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: DatosTablet) => crearTablet(datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.tablets }),
  });
}

export function useEditarTablet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: DatosTablet }) => editarTablet(id, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.tablets }),
  });
}

export function useCambiarEstadoTablet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoTablet }) =>
      cambiarEstadoTablet(id, estado),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.tablets }),
  });
}
