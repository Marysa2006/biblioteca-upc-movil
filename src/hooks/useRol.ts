/**
 * Tipo de usuario, roles del personal y permisos de quien tiene la sesión abierta (HU-07).
 * Es el hook que usa la vista del personal para mostrar u ocultar funciones:
 *
 *   const { esAdministrador, tienePermiso } = useRol();
 *   {tienePermiso('contenidos') ? <BotonContenidos /> : null}
 *
 * La pantalla no decide los permisos: solo pregunta. La lista vive en src/utils/roles.ts.
 * Los permisos son la suma de los de sus roles del personal.
 */
import { useCallback, useMemo } from 'react';

import { useSesion } from '@/store/sesion';
import type { Permiso, Rol, RolPersonal, TipoUsuario } from '@/types';
import { esPersonal, permisosDe, tieneRol } from '@/utils/roles';

const SIN_ROLES: RolPersonal[] = [];

export function useRol() {
  const usuario = useSesion((estado) => estado.usuario);
  const tipo: TipoUsuario = usuario?.tipo ?? 'visitante';
  const rolesPersonal = usuario?.rolesPersonal ?? SIN_ROLES;

  const permisos = useMemo(() => permisosDe(usuario), [usuario]);
  const tienePermiso = useCallback((permiso: Permiso) => permisos.includes(permiso), [permisos]);

  /** @deprecated Usa tipo o rolesPersonal: el primer rol del personal, o el tipo si no tiene. */
  const rol: Rol = rolesPersonal[0] ?? tipo;

  return {
    usuario,
    tipo,
    rolesPersonal,
    rol,
    esPersonal: esPersonal(usuario),
    esAdministrador: tieneRol(usuario, 'administrador'),
    permisos,
    tienePermiso,
  };
}
