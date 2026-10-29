/**
 * Hooks de las guías de la biblioteca (HU-29, función plus).
 *
 * useGuias() lista las publicadas (CA1). useGuia() abre una guía: si hay conexión la
 * guarda en el celular (CA2/CA3); si falla, devuelve la copia guardada y, si tampoco
 * existe, deja el error para que la pantalla explique que hace falta internet (CA4).
 * useGuiasGuardadas/useGuiasGuardadasCompletas/useGuardarGuia/useEliminarGuia manejan lo
 * descargado.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import { obtenerGuia, obtenerGuias } from '@/api/guias';
import type { Guia } from '@/types';
import {
  eliminarGuia,
  guardarGuia,
  idsGuardadas,
  leerGuiaGuardada,
} from '@/utils/guiasOffline';

export function useGuias() {
  return useQuery({
    queryKey: claves.guias,
    queryFn: obtenerGuias,
  });
}

/** Detalle de una guía con respaldo en la copia guardada. */
export function useGuia(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: claves.guia(id),
    queryFn: async () => {
      try {
        const guia = await obtenerGuia(id);
        guardarGuia(guia);
        await queryClient.invalidateQueries({ queryKey: claves.guiasGuardadas });
        return guia;
      } catch (error) {
        const guardada = leerGuiaGuardada(id);
        if (guardada) {
          return guardada.guia;
        }
        throw error;
      }
    },
    enabled: id !== '',
    retry: false,
  });
}

export function useGuiasGuardadas() {
  return useQuery({
    queryKey: claves.guiasGuardadas,
    queryFn: () => idsGuardadas(),
    staleTime: 0,
  });
}

/**
 * Copias guardadas completas (título, fecha y texto), para la lista sin conexión (CA2) y para
 * saber si hay versión nueva (CA3). Se refresca con las mismas invalidaciones de las guardadas.
 */
export function useGuiasGuardadasCompletas() {
  return useQuery({
    queryKey: [...claves.guiasGuardadas, 'completas'],
    queryFn: () =>
      idsGuardadas()
        .map((id) => leerGuiaGuardada(id))
        .filter((guardada) => guardada != null),
    staleTime: 0,
  });
}

export function useGuardarGuia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (guia: Guia) => {
      guardarGuia(guia);
      return guia;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.guiasGuardadas }),
  });
}

export function useEliminarGuia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      eliminarGuia(id);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.guiasGuardadas }),
  });
}
