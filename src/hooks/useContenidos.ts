/**
 * Hooks de contenidos del portal (HU-04).
 * Listan, crean, editan, publican/ocultan y reordenan los contenidos y avisos.
 * La pantalla solo usa estos hooks: no conoce la API ni los mocks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import {
  cambiarPublicacionContenido,
  crearContenido,
  editarContenido,
  obtenerContenidos,
  reordenarContenidos,
  type DatosContenido,
} from '@/api/contenidos';

const CLAVE = claves.contenidos;

export function useContenidos() {
  return useQuery({
    queryKey: CLAVE,
    queryFn: obtenerContenidos,
  });
}

export function useCrearContenido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: DatosContenido) => crearContenido(datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useEditarContenido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: DatosContenido }) =>
      editarContenido(id, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useCambiarPublicacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, publicado }: { id: string; publicado: boolean }) =>
      cambiarPublicacionContenido(id, publicado),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useReordenarContenidos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idsEnOrden: string[]) => reordenarContenidos(idsEnOrden),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  });
}
