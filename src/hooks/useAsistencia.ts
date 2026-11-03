/**
 * Hooks del control de asistencia con QR (HU-33).
 *
 *   const abrir = useAbrirAsistencia();
 *   const { data: asistencia } = useAsistencia(sesionId);
 *   const manual = useMarcarAsistenciaManual();
 *
 * Abrir, marcar y cerrar invalidan la asistencia de la sesión para que la lista y el total
 * queden al día en la pantalla del facilitador.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  abrirAsistencia,
  cerrarAsistencia,
  marcarAsistenciaManual,
  obtenerAsistentes,
} from '@/api/asistencia';
import { claves } from '@/api/claves';

/** Asistencia de la sesión: código vigente, registros y total (CA2). */
export function useAsistencia(sesionId: string) {
  return useQuery({
    queryKey: claves.asistenciaSesion(sesionId),
    queryFn: () => obtenerAsistentes(sesionId),
    enabled: sesionId !== '',
  });
}

export function useAbrirAsistencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sesionId: string) => abrirAsistencia(sesionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.asistenciasTodas }),
  });
}

export function useMarcarAsistenciaManual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sesionId, usuarioId }: { sesionId: string; usuarioId: string }) =>
      marcarAsistenciaManual(sesionId, usuarioId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.asistenciasTodas }),
  });
}

export function useCerrarAsistencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sesionId: string) => cerrarAsistencia(sesionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.asistenciasTodas }),
  });
}
