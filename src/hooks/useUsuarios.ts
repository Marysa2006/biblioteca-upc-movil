/**
 * Hooks de usuarios, roles y permisos del personal (HU-07 y versión 1.1).
 * useUsuarios() lista el directorio; useEquipo() solo al personal; useActualizarRolesPersonal()
 * asigna o retira roles y useActualizarPermisosExtra() da o quita el permiso de novedades.
 *
 * Regla de la HU-07: la administración no puede retirarse su propio rol de
 * administrador (CA4). Se valida aquí, antes de llamar a la API.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import {
  actualizarPermisosExtra,
  actualizarRolesPersonal,
  obtenerEquipo,
  obtenerUsuarios,
} from '@/api/usuarios';
import { useSesion } from '@/store/sesion';
import type { Permiso, RolPersonal } from '@/types';
import { tieneRol } from '@/utils/roles';

export function useUsuarios() {
  return useQuery({
    queryKey: claves.usuarios,
    queryFn: obtenerUsuarios,
  });
}

/** Solo el personal de la biblioteca, con sus permisos extra (versión 1.1, #256). */
export function useEquipo() {
  return useQuery({
    queryKey: claves.equipo,
    queryFn: obtenerEquipo,
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
      queryClient.invalidateQueries({ queryKey: claves.usuarios });
    },
  });
}

/** Da o quita el permiso de novedades (versión 1.1, #256). Refresca el equipo. */
export function useActualizarPermisosExtra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ usuarioId, permisos }: { usuarioId: string; permisos: Permiso[] }) => {
      const usuario = useSesion.getState().usuario;
      if (!usuario) return Promise.reject(new Error('No hay sesión'));
      return actualizarPermisosExtra(usuario, usuarioId, permisos);
    },
    onSuccess: (actualizado) => {
      queryClient.invalidateQueries({ queryKey: claves.usuarios });
      queryClient.invalidateQueries({ queryKey: claves.equipo });
      // Si el permiso se lo dieron a la persona de la sesión, su sesión cambia: se refresca.
      const propio = useSesion.getState().usuario;
      if (propio && propio.id === actualizado.id) {
        useSesion.setState({ usuario: { ...propio, permisosExtra: actualizado.permisosExtra } });
      }
    },
  });
}
