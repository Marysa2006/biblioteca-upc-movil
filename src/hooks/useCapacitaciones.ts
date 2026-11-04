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
  solicitudesActivasDeLinea,
  aprobarCapacitacion,
  asignarResponsable,
  cerrarCapacitacion,
  obtenerMisCapacitaciones,
  obtenerSolicitudesCapacitacion,
  proponerFechaCapacitacion,
  rechazarCapacitacion,
  responderNuevaFecha,
  solicitarCapacitacion,
  type DatosLinea,
  type FormularioCapacitacion,
} from '@/api/capacitaciones';
import { claves } from '@/api/claves';
import type { EstadoSolicitud } from '@/types';
import { useSesion } from '@/store/sesion';

/** Para que las pantallas de HU-09 (Jhon) y HU-10 (María) tipen sin importar de src/api. */
export type { DatosLinea, FormularioCapacitacion } from '@/api/capacitaciones';

export function useLineas() {
  return useQuery({
    queryKey: claves.lineasFormacion,
    queryFn: obtenerLineas,
  });
}

/**
 * Solicitudes activas de una línea, para advertir ANTES de desactivarla (HU-09, CA3).
 * cambiarEstadoLinea() también las devuelve, pero ya desactivada. No consulta sin id.
 * La clave cuelga de las líneas: se refresca con sus mismas invalidaciones.
 */
export function useSolicitudesActivasLinea(lineaId: string) {
  return useQuery({
    queryKey: [...claves.lineasFormacion, lineaId, 'solicitudes-activas'],
    queryFn: () => solicitudesActivasDeLinea(lineaId),
    enabled: lineaId !== '',
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


// ── HU-12: gestionar las solicitudes de formación ──────────────────────────

/**
 * Solicitudes para la bandeja de Gestión → Solicitudes. Se refresca sola con cada mutación:
 * todas cuelgan del prefijo ['capacitaciones', 'solicitudes'].
 */
export function useSolicitudesCapacitacion(estado: EstadoSolicitud | 'todas' = 'todas') {
  return useQuery({
    queryKey: claves.solicitudesCapacitacion(estado),
    queryFn: () => obtenerSolicitudesCapacitacion(estado),
  });
}

/** Invalida la bandeja, las de la persona, el historial (HU-08) y las estadísticas (HU-25). */
function refrescarSolicitudes(queryClient: ReturnType<typeof useQueryClient>) {
  // `solicitudesTodas` cubre la bandeja y las de la persona (['solicitudes', ...]).
  queryClient.invalidateQueries({ queryKey: claves.solicitudesTodas });
  // La campana de notificaciones, como en las demás mutaciones.
  queryClient.invalidateQueries({ queryKey: claves.notificaciones });
  // HU-25: el registro de uso se actualiza, así que los indicadores cambian.
  queryClient.invalidateQueries({ queryKey: claves.estadisticasTodas });
}

export function useAprobarCapacitacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => aprobarCapacitacion(id),
    onSuccess: () => refrescarSolicitudes(queryClient),
  });
}

export function useRechazarCapacitacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      rechazarCapacitacion(id, motivo),
    onSuccess: () => refrescarSolicitudes(queryClient),
  });
}

export function useProponerFechaCapacitacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fecha, hora }: { id: string; fecha: string; hora: string }) =>
      proponerFechaCapacitacion(id, fecha, hora),
    onSuccess: () => refrescarSolicitudes(queryClient),
  });
}

export function useAsignarResponsable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, usuarioId }: { id: string; usuarioId: string }) =>
      asignarResponsable(id, usuarioId),
    onSuccess: () => refrescarSolicitudes(queryClient),
  });
}

export function useCerrarCapacitacion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resultado }: { id: string; resultado: string }) =>
      cerrarCapacitacion(id, resultado),
    onSuccess: () => refrescarSolicitudes(queryClient),
  });
}

/** La comunidad acepta o rechaza la nueva fecha propuesta (HU-12, CA4). */
export function useResponderNuevaFecha() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, acepta }: { id: string; acepta: boolean }) =>
      responderNuevaFecha(id, acepta),
    onSuccess: () => refrescarSolicitudes(queryClient),
  });
}
