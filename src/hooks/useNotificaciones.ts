/**
 * Hooks de notificaciones (HU-27).
 * La pantalla (María, #57) usa estos hooks: no llama a la API ni a los mocks.
 *
 *   const { data: avisos, isError, refetch } = useNotificaciones();
 *   const marcar = useMarcarLeida();
 *   marcar.mutate(aviso.id);
 *
 * Los avisos los crean HU-18, HU-19 y HU-20; aquí solo se consultan y se marcan leídos.
 * Si la carga falla, la pantalla ofrece reintentar con refetch() (CA3).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import { marcarLeida, obtenerNotificaciones } from '@/api/notificaciones';
import { useSesion } from '@/store/sesion';

/** Notificaciones del usuario de la sesión, la más reciente primero. No consulta sin sesión. */
export function useNotificaciones() {
  const usuario = useSesion((estado) => estado.usuario);

  return useQuery({
    // El id va dentro de la clave: la caché es por usuario. Las mutaciones invalidan con el
    // prefijo claves.notificaciones, que también cubre esta clave.
    queryKey: [...claves.notificaciones, usuario?.id],
    queryFn: () => {
      if (!usuario) throw new Error('No hay sesión');
      return obtenerNotificaciones(usuario.id);
    },
    enabled: usuario != null,
  });
}

/** Marca una notificación como leída y refresca la lista. */
export function useMarcarLeida() {
  const queryClient = useQueryClient();
  const usuario = useSesion((estado) => estado.usuario);

  return useMutation({
    mutationFn: (id: string) => {
      if (!usuario) throw new Error('No hay sesión');
      return marcarLeida(usuario.id, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.notificaciones });
    },
  });
}
