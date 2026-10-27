/**
 * Hooks del inventario de tablets (HU-21) y de la entrega/devolución (HU-23).
 * Las mutaciones refrescan los préstamos, las tablets y la disponibilidad.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import {
  cambiarEstadoTablet,
  crearTablet,
  editarTablet,
  obtenerPrestamos,
  obtenerTablets,
  registrarDevolucion,
  registrarEntrega,
  type DatosDevolucion,
  type DatosEntrega,
  type DatosTablet,
} from '@/api/tablets';
import type { EstadoPrestamo, EstadoTablet } from '@/types';

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

/** Préstamos de tablets, filtrados por estado (HU-23). */
export function usePrestamos(estado: EstadoPrestamo | 'todas' = 'todas') {
  return useQuery({
    queryKey: claves.prestamosPorEstado(estado),
    queryFn: () => obtenerPrestamos(estado),
  });
}

/** Registra la entrega y refresca los préstamos y las tablets (HU-23, CA1). */
export function useRegistrarEntrega() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ prestamoId, datos }: { prestamoId: string; datos: DatosEntrega }) =>
      registrarEntrega(prestamoId, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.prestamosTablet });
      queryClient.invalidateQueries({ queryKey: claves.tablets });
    },
  });
}

/** Registra la devolución y refresca los préstamos y las tablets (HU-23, CA2-CA4). */
export function useRegistrarDevolucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ prestamoId, datos }: { prestamoId: string; datos: DatosDevolucion }) =>
      registrarDevolucion(prestamoId, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.prestamosTablet });
      queryClient.invalidateQueries({ queryKey: claves.tablets });
    },
  });
}
