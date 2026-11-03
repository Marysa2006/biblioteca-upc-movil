/**
 * Hooks de capacitaciones (HU-09 y HU-10). Las mutaciones de líneas refrescan las líneas y,
 * con ellas, las que se ofrecen en el formulario de solicitud. Solicitar refresca las
 * solicitudes, "Mis solicitudes" (HU-08), las notificaciones y las estadísticas (HU-25).
 *
 *   const { data: lineas, isPending, isError, refetch } = useLineas();
 *   const solicitar = useSolicitarCapacitacion();
 *   solicitar.mutate(datos, { onError: (e) => fechaSugeridaDeError(e) });
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cambiarEstadoLinea,
  crearLinea,
  editarLinea,
  ErrorCapacitacion,
  obtenerLineas,
  obtenerMisCapacitaciones,
  solicitarCapacitacion,
  type DatosLinea,
  type FormularioCapacitacion,
} from '@/api/capacitaciones';
import { claves } from '@/api/claves';
import { useSesion } from '@/store/sesion';

/** Para que las pantallas de HU-09 (Jhon) y HU-10 (María) tipen sin importar de src/api. */
export type { DatosLinea, FormularioCapacitacion } from '@/api/capacitaciones';

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

/**
 * Solicita una capacitación a nombre del usuario de la sesión (HU-10). Si la fecha no sirve,
 * el error trae una fecha sugerida: fechaSugeridaDeError(error) (CA3).
 */
export function useSolicitarCapacitacion() {
  const queryClient = useQueryClient();
  const usuario = useSesion((estado) => estado.usuario);

  return useMutation({
    mutationFn: (datos: FormularioCapacitacion) => {
      if (!usuario) throw new Error('No hay sesión');
      return solicitarCapacitacion(usuario, datos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.solicitudesCapacitacionTodas });
      queryClient.invalidateQueries({ queryKey: claves.solicitudesTodas });
      queryClient.invalidateQueries({ queryKey: claves.notificaciones });
      queryClient.invalidateQueries({ queryKey: claves.estadisticasTodas });
    },
  });
}

/** Solicitudes del usuario de la sesión, la más reciente primero. No consulta sin sesión. */
export function useMisCapacitaciones() {
  const usuario = useSesion((estado) => estado.usuario);

  return useQuery({
    queryKey: claves.misCapacitaciones(usuario?.id),
    queryFn: () => {
      if (!usuario) throw new Error('No hay sesión');
      return obtenerMisCapacitaciones(usuario.id);
    },
    enabled: usuario != null,
  });
}

/**
 * La fecha sugerida de un error de solicitud (CA3), o undefined si el error es otro. Así la
 * pantalla no importa ErrorCapacitacion desde src/api:
 *   const sugerida = fechaSugeridaDeError(solicitar.error);
 */
export function fechaSugeridaDeError(error: unknown): string | undefined {
  return error instanceof ErrorCapacitacion ? error.fechaSugerida : undefined;
}
