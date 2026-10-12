/**
 * Hooks de usuarios y roles (HU-07).
 * useUsuarios() lista el directorio; useCambiarRol() asigna o retira un rol.
 *
 * Regla de la HU-07: el administrador no puede retirarse su propio rol de
 * administrador (CA4). Se valida aquí, antes de llamar a la API.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cambiarRolUsuario, obtenerUsuarios } from '@/api/usuarios';
import { useSesion } from '@/store/sesion';
import type { Rol } from '@/types';

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: obtenerUsuarios,
  });
}

type CambioRol = { usuarioId: string; rol: Rol };

export function useCambiarRol() {
  const queryClient = useQueryClient();
  const usuario = useSesion((estado) => estado.usuario);

  return useMutation({
    mutationFn: ({ usuarioId, rol }: CambioRol) => {
      const esUnoMismo = usuario?.id === usuarioId;
      const seRetiraElPropioAdmin =
        esUnoMismo && usuario?.rol === 'administrador' && rol !== 'administrador';
      if (seRetiraElPropioAdmin) {
        return Promise.reject(
          new Error('No puedes retirarte tu propio rol de administrador.'),
        );
      }
      return cambiarRolUsuario(usuarioId, rol);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}
