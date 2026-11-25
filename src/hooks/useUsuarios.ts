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
import { obtenerFacilitadores } from '@/api/asesorias';
import {
  actualizarPermisosExtra,
  actualizarRolesPersonal,
  cambiarAccesoUsuario,
  obtenerEquipo,
  obtenerUsuarios,
  guardarFirmaPersonal,
} from '@/api/usuarios';
import { useSesion } from '@/store/sesion';
import type { FirmaElectronica, Permiso, RolPersonal } from '@/types';
import { tienePermiso, tieneRol } from '@/utils/roles';

export function useUsuarios() {
  return useQuery({
    queryKey: claves.usuarios,
    queryFn: () => obtenerUsuarios(),
  });
}

/** Solo el personal de la biblioteca, con sus permisos extra (versión 1.1, #256). */
export function useEquipo() {
  return useQuery({
    queryKey: claves.equipo,
    queryFn: obtenerEquipo,
  });
}

export function useFacilitadores(habilitado: boolean) {
  const autorizado = useSesion((estado) => tienePermiso(estado.usuario, 'roles'));
  const consultar = habilitado && autorizado;
  return useQuery({
    queryKey: [...claves.equipo, 'facilitadores'],
    queryFn: () => consultar ? obtenerFacilitadores() : [],
    enabled: consultar,
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: claves.usuarios });
      queryClient.invalidateQueries({ queryKey: claves.equipo });
    },
  });
}

export function useCambiarAccesoUsuario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => cambiarAccesoUsuario(id, activo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.usuarios });
      queryClient.invalidateQueries({ queryKey: claves.equipo });
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

/**
 * Guarda la firma del personal de la sesión (revisión de la 1.1), registrada una vez en el Perfil:
 * se pone sola en las constancias que entregue o reciba. También la deja en la sesión.
 */
export function useGuardarMiFirma() {
  return useMutation({
    mutationFn: async (firma: FirmaElectronica | null) => {
      const { usuario } = useSesion.getState();
      if (!usuario) throw new Error('No hay sesión.');
      await guardarFirmaPersonal(usuario.id, firma);
      return firma;
    },
    onSuccess: (firma) => {
      const { usuario } = useSesion.getState();
      if (!usuario) return;
      const { firma: _anterior, ...resto } = usuario;
      useSesion.setState({ usuario: firma ? { ...resto, firma } : resto });
    },
  });
}
