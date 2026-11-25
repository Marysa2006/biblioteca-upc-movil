/**
 * Hooks de espacios: catálogo (HU-16) y disponibilidad (HU-17).
 * Las pantallas de María (#53) y Jhon (#59) solo usan estos hooks.
 */
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import {
  cambiarEstadoEspacio,
  crearEspacio,
  editarEspacio,
  eliminarEspacio,
  obtenerDisponibilidad,
  obtenerEspacios,
  obtenerTodosLosEspacios,
  reservasFuturasDeEspacio,
  type DatosEspacio,
} from '@/api/espacios';

/** Espacios activos para la comunidad (HU-17). */
export function useEspacios() {
  return useQuery({
    queryKey: claves.espacios,
    queryFn: obtenerEspacios,
  });
}

/** Disponibilidad de un espacio entre dos fechas (ambas incluidas). */
export function useDisponibilidad(espacioId: string, desde: string, hasta: string) {
  return useQuery({
    queryKey: claves.disponibilidad(espacioId, desde, hasta),
    queryFn: () => obtenerDisponibilidad(espacioId, desde, hasta),
    enabled: espacioId !== '' && desde !== '' && hasta !== '',
  });
}

/** Todos los espacios, también los inactivos, para la administración (HU-16). */
export function useEspaciosAdministracion() {
  return useQuery({
    queryKey: claves.espaciosAdministracion,
    queryFn: obtenerTodosLosEspacios,
  });
}

/** Reservas futuras de un espacio, para advertir antes de desactivarlo (CA3). */
export function useReservasFuturas(espacioId: string) {
  return useQuery(consultaReservasFuturas(espacioId));
}

function consultaReservasFuturas(espacioId: string) {
  return {
    queryKey: claves.espacioReservas(espacioId),
    queryFn: () => reservasFuturasDeEspacio(espacioId),
    enabled: espacioId !== '',
  };
}

export function useReservasFuturasPorEspacio(ids: string[]) {
  const consultas = useQueries({ queries: ids.map(consultaReservasFuturas) });
  return new Map(ids.map((id, indice) => [id, consultas[indice]]));
}

export function useCrearEspacio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: DatosEspacio) => crearEspacio(datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.espacios }),
  });
}

export function useEditarEspacio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos, confirmar }: { id: string; datos: DatosEspacio; confirmar?: boolean }) =>
      editarEspacio(id, datos, confirmar),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.espacios }),
  });
}

export function useCambiarEstadoEspacio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo, confirmar }: { id: string; activo: boolean; confirmar?: boolean }) =>
      cambiarEstadoEspacio(id, activo, confirmar),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.espacios });
      queryClient.invalidateQueries({ queryKey: claves.disponibilidadTodas });
    },
  });
}

export function useEliminarEspacio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => eliminarEspacio(id, motivo),
    onSuccess: () => {
      for (const queryKey of [claves.espacios, claves.reservas, claves.disponibilidadTodas, claves.bloqueos, claves.notificaciones, claves.estadisticasTodas]) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
