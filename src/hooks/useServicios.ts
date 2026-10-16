/**
 * EJEMPLO DE REFERENCIA de un hook de datos.
 * La pantalla solo conoce este hook: no sabe si los datos vienen del mock o de la API.
 *
 * Lectura para la comunidad (HU-01) y administración de servicios (HU-04).
 * Las mutaciones refrescan todo lo que empieza por ['servicios']: Inicio, Servicios,
 * el detalle y la lista de la administración se actualizan solos.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cambiarEstadoServicio,
  crearServicio,
  editarServicio,
  obtenerServicio,
  obtenerServicios,
  obtenerTodosLosServicios,
  type DatosServicio,
} from '@/api/servicios';

const CLAVE = ['servicios'];

export function useServicios() {
  return useQuery({
    queryKey: CLAVE,
    queryFn: obtenerServicios,
  });
}

/** Detalle de un servicio por su id. No consulta mientras el id esté vacío. */
export function useServicio(id: string) {
  return useQuery({
    queryKey: ['servicios', id],
    queryFn: () => obtenerServicio(id),
    enabled: id !== '',
  });
}

/** Todos los servicios, también los inactivos (HU-04). */
export function useServiciosAdministracion() {
  return useQuery({
    queryKey: ['servicios', 'administracion'],
    queryFn: obtenerTodosLosServicios,
  });
}

export function useCrearServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: DatosServicio) => crearServicio(datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useEditarServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: DatosServicio }) => editarServicio(id, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useCambiarEstadoServicio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      cambiarEstadoServicio(id, activo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE }),
  });
}
