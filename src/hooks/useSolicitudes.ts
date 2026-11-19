/**
 * Hooks de «Mis solicitudes» (HU-08). La lista reúne reservas, citas, préstamos y
 * capacitaciones; el detalle trae el historial de una. Las dos claves viven bajo
 * claves.solicitudesTodas, que refrescan todas las mutaciones de solicitudes.
 *
 *   const { data: solicitudes, isPending, isError, refetch } = useMisSolicitudes();
 *   const { data: historial } = useHistorialSolicitud(tipo, id);
 *   const calificar = useCalificarSolicitud(); // #254
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import { obtenerHistorialSolicitud } from '@/api/historial';
import {
  calificarSolicitud,
  obtenerMisSolicitudes,
  type DatosCalificacion,
  type TipoCalificable,
} from '@/api/solicitudes';
import { useSesion } from '@/store/sesion';
import type { TipoSolicitud } from '@/types';

/** Para que las pantallas de HU-08 (María) tipen los datos sin importar de src/api. */
export type { EventoSolicitud, ResumenSolicitud, TipoSolicitud } from '@/types';
export type { DatosCalificacion, FiltroSolicitudes, TipoCalificable } from '@/api/solicitudes';

/**
 * Todas las solicitudes del usuario de la sesión, la más reciente primero (CA1). El filtro
 * por estado se aplica en la pantalla: la clave no lo incluye. No consulta sin sesión.
 */
export function useMisSolicitudes() {
  const usuario = useSesion((estado) => estado.usuario);

  return useQuery({
    queryKey: claves.misSolicitudes(usuario?.id ?? 'sin-sesion'),
    queryFn: () => {
      if (!usuario) throw new Error('No hay sesión');
      return obtenerMisSolicitudes(usuario.id);
    },
    enabled: usuario != null,
  });
}

/** Historial de una solicitud, en orden cronológico (CA2). No consulta sin tipo o id. */
export function useHistorialSolicitud(tipo: TipoSolicitud | '', id: string) {
  return useQuery({
    queryKey: claves.detalleSolicitud(tipo as TipoSolicitud, id),
    queryFn: () => obtenerHistorialSolicitud(tipo as TipoSolicitud, id),
    enabled: tipo !== '' && id !== '',
  });
}

/** Lo que manda la pantalla al calificar (#254). */
export type DatosCalificarSolicitud = DatosCalificacion & { tipo: TipoCalificable; id: string };

/**
 * Califica una asesoría o capacitación realizada del usuario de la sesión, una sola vez (#254).
 * Si ya la calificó, no es suya o no está realizada, el error trae el mensaje para la persona.
 * Refresca Mis solicitudes y el historial, las citas y capacitaciones (que traen la
 * calificación) y las estadísticas (el promedio de HU-26). No crea notificaciones.
 *
 *   const calificar = useCalificarSolicitud();
 *   calificar.mutate({ tipo: 'cita', id, puntaje: 5, comentario });
 */
export function useCalificarSolicitud() {
  const usuario = useSesion((estado) => estado.usuario);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tipo, id, puntaje, comentario }: DatosCalificarSolicitud) => {
      if (!usuario) throw new Error('No hay sesión');
      return calificarSolicitud(tipo, id, { puntaje, comentario }, usuario);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.solicitudesTodas });
      queryClient.invalidateQueries({ queryKey: claves.citasAsesoria });
      queryClient.invalidateQueries({ queryKey: claves.solicitudesCapacitacionTodas });
      queryClient.invalidateQueries({ queryKey: claves.estadisticasTodas });
    },
  });
}
