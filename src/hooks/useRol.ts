/**
 * Rol y permisos del usuario con la sesión abierta (HU-07).
 * Es el hook que usa la vista del personal para mostrar u ocultar funciones:
 *
 *   const { esAdministrador, tienePermiso } = useRol();
 *   {tienePermiso('contenidos') ? <BotonContenidos /> : null}
 *
 * La pantalla no decide los permisos: solo pregunta. La lista vive en src/utils/roles.ts.
 */
import { useCallback, useMemo } from 'react';

import { useSesion } from '@/store/sesion';
import type { Permiso } from '@/types';
import { esPersonal, permisosDe, tienePermiso as tienePermisoRol } from '@/utils/roles';

export function useRol() {
  const usuario = useSesion((estado) => estado.usuario);
  const rol = usuario?.rol ?? 'visitante';

  const permisos = useMemo(() => permisosDe(rol), [rol]);
  const tienePermiso = useCallback((permiso: Permiso) => tienePermisoRol(rol, permiso), [rol]);

  return {
    usuario,
    rol,
    esPersonal: esPersonal(rol),
    esAdministrador: rol === 'administrador',
    permisos,
    tienePermiso,
  };
}
