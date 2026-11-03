/**
 * Hooks de capacitaciones (HU-09). Las mutaciones refrescan las líneas y, con ellas, las
 * que se ofrecen en el formulario de solicitud de HU-10.
 *
 *   const { data: lineas, isPending, isError, refetch } = useLineas();
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cambiarEstadoLinea,
  crearLinea,
  editarLinea,
  obtenerLineas,
  type DatosLinea,
} from '@/api/capacitaciones';
import { claves } from '@/api/claves';

/** Para que la pantalla de HU-09 (Jhon) tipe los datos sin importar de src/api. */
export type { DatosLinea } from '@/api/capacitaciones';

export function useLineas() {
  return useQuery({
    queryKey: claves.lineasFormacion,
    queryFn: obtenerLineas,
  });
}

export function useCrearLinea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: DatosLinea) => crearLinea(datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.lineasFormacion }),
  });
}

export function useEditarLinea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: DatosLinea }) => editarLinea(id, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.lineasFormacion }),
  });
}

export function useCambiarEstadoLinea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activa }: { id: string; activa: boolean }) =>
      cambiarEstadoLinea(id, activa),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.lineasFormacion }),
  });
}
