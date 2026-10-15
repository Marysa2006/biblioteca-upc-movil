/**
 * Hooks del perfil de usuario (HU-06).
 * La pantalla (María, #16) usa estos hooks: no llama a la API ni a los mocks.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { actualizarPerfil, obtenerPerfil } from '@/api/perfil';
import { useSesion } from '@/store/sesion';
import type { DatosEditablesPerfil } from '@/types';

/** Perfil del usuario con sesión. No consulta mientras no haya sesión. */
export function usePerfil() {
  const usuario = useSesion((estado) => estado.usuario);

  return useQuery({
    queryKey: ['perfil', usuario?.id],
    queryFn: () => {
      if (!usuario) throw new Error('No hay sesión');
      return obtenerPerfil(usuario);
    },
    enabled: usuario != null,
  });
}

/** Guarda los datos editables del usuario de la sesión y actualiza la caché. */
export function useActualizarPerfil() {
  const queryClient = useQueryClient();
  const usuario = useSesion((estado) => estado.usuario);

  return useMutation({
    mutationFn: (datos: DatosEditablesPerfil) => {
      if (!usuario) throw new Error('No hay sesión');
      return actualizarPerfil(usuario, datos);
    },
    onSuccess: (perfil) => {
      queryClient.setQueryData(['perfil', usuario?.id], perfil);
    },
  });
}
