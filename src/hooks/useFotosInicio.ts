/**
 * Hooks de las fotos del carrusel de Inicio (#290, versión 1.1).
 * useFotosInicio() da las publicadas, en su orden, y no pide sesión. Las demás son del personal
 * (permiso `contenidos` o `novedades`; la API decide) y refrescan las dos listas con el prefijo
 * ['fotosInicio'].
 *
 *   const { data: fotos } = useFotosInicio();
 *   const guardar = useGuardarFotoInicio();
 *   guardar.mutate({ datos: { imagen, descripcion, publicada: true } });
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import {
  cambiarPublicacionFotoInicio,
  guardarFotoInicio,
  obtenerFotosInicio,
  obtenerFotosInicioAdministracion,
  reordenarFotosInicio,
  type DatosFotoInicio,
} from '@/api/fotosInicio';
import { useSesion } from '@/store/sesion';

/** Para que el formulario tipe lo que envía sin importar de src/api. */
export type { DatosFotoInicio } from '@/api/fotosInicio';

/** Las fotos publicadas, para el carrusel de Inicio (CA1). */
export function useFotosInicio() {
  return useQuery({
    queryKey: claves.fotosInicio,
    queryFn: obtenerFotosInicio,
  });
}

/** Todas las fotos, también las ocultas, para Gestión. No consulta sin sesión. */
export function useFotosInicioAdministracion() {
  const usuario = useSesion((estado) => estado.usuario);
  return useQuery({
    queryKey: claves.fotosInicioAdministracion,
    queryFn: () => {
      if (!usuario) return Promise.reject(new Error('No hay sesión'));
      return obtenerFotosInicioAdministracion(usuario);
    },
    enabled: usuario != null,
  });
}

/** Refresca Inicio y la lista del personal: comparten el prefijo ['fotosInicio']. */
function useRefrescarFotos() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: claves.fotosInicio });
}

/** Agrega una foto (sin id) o edita una (CA1 y CA5). */
export function useGuardarFotoInicio() {
  const refrescar = useRefrescarFotos();
  const usuario = useSesion((estado) => estado.usuario);
  return useMutation({
    mutationFn: ({ id, datos }: { id?: string; datos: DatosFotoInicio }) => {
      if (!usuario) return Promise.reject(new Error('No hay sesión'));
      return guardarFotoInicio(usuario, datos, id);
    },
    onSuccess: refrescar,
  });
}

/** Publica u oculta una foto (CA2); más de MAXIMO_FOTOS_INICIO publicadas da 400 (CA4). */
export function useCambiarPublicacionFotoInicio() {
  const refrescar = useRefrescarFotos();
  const usuario = useSesion((estado) => estado.usuario);
  return useMutation({
    mutationFn: ({ id, publicada }: { id: string; publicada: boolean }) => {
      if (!usuario) return Promise.reject(new Error('No hay sesión'));
      return cambiarPublicacionFotoInicio(usuario, id, publicada);
    },
    onSuccess: refrescar,
  });
}

/** Cambia el orden del carrusel (CA2): todos los ids, en el orden nuevo. */
export function useReordenarFotosInicio() {
  const refrescar = useRefrescarFotos();
  const usuario = useSesion((estado) => estado.usuario);
  return useMutation({
    mutationFn: (idsEnOrden: string[]) => {
      if (!usuario) return Promise.reject(new Error('No hay sesión'));
      return reordenarFotosInicio(usuario, idsEnOrden);
    },
    onSuccess: refrescar,
  });
}
