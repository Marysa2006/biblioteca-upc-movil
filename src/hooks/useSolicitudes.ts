/**
 * Hooks de «Mis solicitudes» (HU-08). La lista reúne reservas, citas, préstamos y
 * capacitaciones; el detalle trae el historial de una. Las dos claves viven bajo
 * claves.solicitudesTodas, que refrescan todas las mutaciones de solicitudes.
 *
 *   const { data: solicitudes, isPending, isError, refetch } = useMisSolicitudes();
 *   const { data: historial } = useHistorialSolicitud(tipo, id);
 */
import { useQuery } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import { obtenerHistorialSolicitud } from '@/api/historial';
import { obtenerMisSolicitudes } from '@/api/solicitudes';
import { useSesion } from '@/store/sesion';
import type { TipoSolicitud } from '@/types';

/** Para que las pantallas de HU-08 (María) tipen los datos sin importar de src/api. */
export type { EventoSolicitud, ResumenSolicitud, TipoSolicitud } from '@/types';
export type { FiltroSolicitudes } from '@/api/solicitudes';

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
