import type { Permiso, Rol } from '@/types';

/** Roles que entran a la vista del personal de la biblioteca. */
export const ROLES_PERSONAL: readonly Rol[] = ['administrador', 'facilitador'];

export function esPersonal(rol?: Rol | null): boolean {
  return rol != null && ROLES_PERSONAL.includes(rol);
}

export const NOMBRE_ROL: Record<Rol, string> = {
  visitante: 'Visitante',
  estudiante: 'Estudiante',
  docente: 'Docente',
  administrativo: 'Administrativo',
  administrador: 'Administración de la biblioteca',
  facilitador: 'Facilitador',
};

/**
 * Permisos de cada rol (HU-07).
 * La comunidad (visitante, estudiante, docente, administrativo) no administra la
 * biblioteca: lo que puede hacer vive en la vista de la comunidad, no en estos permisos.
 */
export const PERMISOS_POR_ROL: Record<Rol, readonly Permiso[]> = {
  visitante: [],
  estudiante: [],
  docente: [],
  administrativo: [],
  administrador: [
    'roles',
    'contenidos',
    'parametros',
    'espacios',
    'reservas',
    'asesorias',
    'tablets',
    'formacion',
    'estadisticas',
  ],
  facilitador: ['asesorias'],
};

/** Nombre visible de cada permiso, para etiquetas en la pantalla de roles. */
export const NOMBRE_PERMISO: Record<Permiso, string> = {
  roles: 'Roles y permisos',
  contenidos: 'Contenidos del portal',
  parametros: 'Parámetros generales',
  espacios: 'Catálogo de espacios',
  reservas: 'Reservas',
  asesorias: 'Asesorías',
  tablets: 'Préstamo de tablets',
  formacion: 'Capacitaciones',
  estadisticas: 'Estadísticas',
};

/** Permisos de un rol. Sin sesión (rol nulo) no hay ninguno. */
export function permisosDe(rol?: Rol | null): readonly Permiso[] {
  return rol ? PERMISOS_POR_ROL[rol] : [];
}

/** ¿El rol tiene este permiso? */
export function tienePermiso(rol: Rol | null | undefined, permiso: Permiso): boolean {
  return permisosDe(rol).includes(permiso);
}
