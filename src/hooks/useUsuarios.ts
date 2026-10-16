/**
 * Hooks de usuarios y roles del personal (HU-07).
 * useUsuarios() lista el directorio; useActualizarRolesPersonal() asigna o retira roles.
 *
 * Regla de la HU-07: la administración no puede retirarse su propio rol de
 * administrador (CA4). Se valida aquí, antes de llamar a la API.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { actualizarRolesPersonal, obtenerUsuarios } from '@/api/usuarios';
import { useSesion } from '@/store/sesion';
import type { RolPersonal } from '@/types';
import { tieneRol } from '@/utils/roles';

export function useUsuarios() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: obtenerUsuarios,
  });
}

type CambioRoles = { usuarioId: string; rolesPersonal: RolPersonal[] };

export function useActualizarRolesPersonal() {
  const queryClient = useQueryClient();
  const usuario = useSesion((estado) => estado.usuario);

  return useMutation({
    mutationFn: ({ usuarioId, rolesPersonal }: CambioRoles) => {
      const esUnoMismo = usuario?.id === usuarioId;
      const seRetiraElPropioAdmin =
        esUnoMismo && tieneRol(usuario, 'administrador') && !rolesPersonal.includes('administrador');
      if (seRetiraElPropioAdmin) {
        return Promise.reject(new Error('No puedes retirarte tu propio rol de administrador.'));
      }
      return actualizarRolesPersonal(usuarioId, rolesPersonal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
}
