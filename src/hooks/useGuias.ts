/**
 * Hooks de las guías de la biblioteca (HU-29, función plus).
 *
 * useGuias() lista las publicadas (CA1). useGuia() abre una guía: si hay conexión la
 * guarda en el celular (CA2/CA3); si falla, devuelve la copia guardada y, si tampoco
 * existe, deja el error para que la pantalla explique que hace falta internet (CA4).
 * useGuiasGuardadas/useGuiasGuardadasCompletas/useGuardarGuia/useEliminarGuia manejan lo
 * descargado.
 *
 * Versión 1.1 (#258): useGuiasAdministracion/useEditarGuia/useCambiarPublicacionGuia, para que la
 * biblioteca publique sus guías (permiso `contenidos` o `novedades`; la API decide).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import {
  cambiarPublicacionGuia,
  guardarGuia as guardarGuiaApi,
  obtenerGuia,
  obtenerGuias,
  obtenerGuiasAdministracion,
  type DatosGuia,
} from '@/api/guias';
import { useSesion } from '@/store/sesion';
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
        // 404: la biblioteca la despublicó (#258, CA2). Se quita también la copia del celular.
        if (error instanceof Error && 'estado' in error && error.estado === 404) {
          eliminarGuia(id);
          await queryClient.invalidateQueries({ queryKey: claves.guiasGuardadas });
          throw error;
        }
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

/** Todas las guías, también las no publicadas, para Gestión → Portal → Guías (#258). */
export function useGuiasAdministracion() {
  const usuario = useSesion((estado) => estado.usuario);
  return useQuery({
    queryKey: claves.guiasAdministracion,
    queryFn: () => {
      if (!usuario) return Promise.reject(new Error('No hay sesión'));
      return obtenerGuiasAdministracion(usuario);
    },
  });
}

/** Crea (sin id) o edita una guía (#258). Refresca la lista de la comunidad y la del personal. */
export function useEditarGuia() {
  const queryClient = useQueryClient();
  const usuario = useSesion((estado) => estado.usuario);
  return useMutation({
    mutationFn: ({ id, datos }: { id?: string; datos: DatosGuia }) => {
      if (!usuario) return Promise.reject(new Error('No hay sesión'));
      return guardarGuiaApi(usuario, datos, id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.guias }),
  });
}

/** Publica o despublica una guía (#258, CA2). */
export function useCambiarPublicacionGuia() {
  const queryClient = useQueryClient();
  const usuario = useSesion((estado) => estado.usuario);
  return useMutation({
    mutationFn: ({ id, publicado }: { id: string; publicado: boolean }) => {
      if (!usuario) return Promise.reject(new Error('No hay sesión'));
      return cambiarPublicacionGuia(usuario, id, publicado);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.guias }),
  });
}
