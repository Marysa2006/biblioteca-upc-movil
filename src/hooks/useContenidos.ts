/**
 * Hooks de contenidos del portal (HU-04) y del permiso de novedades (versión 1.1, #256).
 * Listan, crean, editan, publican/ocultan y reordenan los contenidos y avisos.
 * La pantalla solo usa estos hooks: no conoce la API ni los mocks.
 *
 * Las mutaciones mandan la persona de la sesión: la API decide con qué permiso (los servicios
 * piden `contenidos`; los avisos, `novedades` o `contenidos`).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import {
  cambiarPublicacionContenido,
  crearContenido,
  editarContenido,
  obtenerContenidos,
  obtenerContenidosPublicos,
  reordenarContenidos,
  type DatosContenido,
} from '@/api/contenidos';
import { useSesion } from '@/store/sesion';

const CLAVE = claves.contenidos;

export function useContenidos() {
  return useQuery({
    queryKey: CLAVE,
    queryFn: obtenerContenidos,
  });
}

export function useContenidosPublicos() {
  return useQuery({
    queryKey: claves.contenidosPublicos,
    queryFn: obtenerContenidosPublicos,
  });
}

export function useCrearContenido() {
  const queryClient = useQueryClient();
  const usuario = useSesion((estado) => estado.usuario);
  return useMutation({
    mutationFn: (datos: DatosContenido) => {
      if (!usuario) return Promise.reject(new Error('No hay sesión'));
      return crearContenido(usuario, datos);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useEditarContenido() {
  const queryClient = useQueryClient();
  const usuario = useSesion((estado) => estado.usuario);
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: DatosContenido }) => {
      if (!usuario) return Promise.reject(new Error('No hay sesión'));
      return editarContenido(usuario, id, datos);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useCambiarPublicacion() {
  const queryClient = useQueryClient();
  const usuario = useSesion((estado) => estado.usuario);
  return useMutation({
    mutationFn: ({ id, publicado }: { id: string; publicado: boolean }) => {
      if (!usuario) return Promise.reject(new Error('No hay sesión'));
      return cambiarPublicacionContenido(usuario, id, publicado);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useReordenarContenidos() {
  const queryClient = useQueryClient();
  const usuario = useSesion((estado) => estado.usuario);
  return useMutation({
    mutationFn: (idsEnOrden: string[]) => {
      if (!usuario) return Promise.reject(new Error('No hay sesión'));
      return reordenarContenidos(usuario, idsEnOrden);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  });
}
