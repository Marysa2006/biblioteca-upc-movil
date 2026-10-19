/**
 * Hooks de bloqueos institucionales (HU-20).
 * useBloqueos() lista los bloqueos; usePrevisualizarBloqueo() muestra las reservas afectadas
 * antes de confirmar; useConfirmarBloqueo() aplica el bloqueo y refresca lo que cambia.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { confirmarBloqueo, obtenerBloqueos, previsualizarBloqueo, type DatosBloqueo } from '@/api/bloqueos';
import { claves } from '@/api/claves';

export function useBloqueos(espacioId?: string) {
  return useQuery({
    queryKey: espacioId ? claves.bloqueosDeEspacio(espacioId) : claves.bloqueos,
    queryFn: () => obtenerBloqueos(espacioId),
  });
}

/** Reservas afectadas por el bloqueo que se está armando (CA1). */
export function usePrevisualizarBloqueo() {
  return useMutation({
    mutationFn: (datos: DatosBloqueo) => previsualizarBloqueo(datos),
  });
}

export function useConfirmarBloqueo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: DatosBloqueo) => confirmarBloqueo(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.bloqueos });
      queryClient.invalidateQueries({ queryKey: claves.reservas });
      queryClient.invalidateQueries({ queryKey: claves.notificaciones });
      queryClient.invalidateQueries({ queryKey: claves.disponibilidadTodas });
    },
  });
}
