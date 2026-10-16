/**
 * Tipo de usuario, roles del personal y permisos (HU-07). Funciones puras, sin hooks.
 *
 * Un usuario tiene un tipo (quién es en la universidad) y una lista de roles del personal
 * (qué hace en la biblioteca; vacía para la comunidad). Sus permisos son la suma de los de
 * sus roles. Los identificadores de los roles son PROVISIONALES: se confirman con Jorge y
 * Rigoberto frente al portal web.
 */
import type { Permiso, Rol, RolPersonal, TipoUsuario, Usuario } from '@/types';

/** Roles del personal de la biblioteca. */
export const ROLES_PERSONAL: readonly RolPersonal[] = [
  'administrador',
  'facilitador',
  'gestor_espacios',
  'encargado_tablets',
];

/**
 * Roles del personal que la administración asigna o retira (HU-07).
 * Administrador no está: es una sola persona y no se asigna desde la app.
 */
export const ROLES_ASIGNABLES: readonly RolPersonal[] = [
  'facilitador',
  'gestor_espacios',
  'encargado_tablets',
];

export const NOMBRE_TIPO: Record<TipoUsuario, string> = {
  estudiante: 'Estudiante',
  docente: 'Docente',
  administrativo: 'Administrativo',
  egresado: 'Egresado',
  visitante: 'Visitante',
};

export const NOMBRE_ROL_PERSONAL: Record<RolPersonal, string> = {
  administrador: 'Administración de la biblioteca',
  facilitador: 'Facilitador',
  gestor_espacios: 'Gestor de espacios',
  encargado_tablets: 'Encargado de préstamos (tablets)',
};

/** @deprecated Usa NOMBRE_TIPO o NOMBRE_ROL_PERSONAL. */
export const NOMBRE_ROL: Record<Rol, string> = { ...NOMBRE_TIPO, ...NOMBRE_ROL_PERSONAL };

/**
 * Permisos de cada rol del personal (HU-07).
 * La comunidad no administra la biblioteca: lo que puede hacer vive en la vista de la comunidad.
 */
export const PERMISOS_POR_ROL: Record<RolPersonal, readonly Permiso[]> = {
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
  facilitador: ['asesorias', 'formacion'],
  gestor_espacios: ['espacios', 'reservas'],
  encargado_tablets: ['tablets'],
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

type ConRoles = Pick<Usuario, 'rolesPersonal'> | null | undefined;

const esRolPersonal = (rol: Rol): rol is RolPersonal =>
  (ROLES_PERSONAL as readonly string[]).includes(rol);

/**
 * ¿Entra a la vista del personal? true si tiene al menos un rol del personal.
 * También acepta un rol suelto, como antes de separar el tipo de los roles.
 */
export function esPersonal(usuario: ConRoles | Rol): boolean {
  if (typeof usuario === 'string') return esRolPersonal(usuario);
  return (usuario?.rolesPersonal.length ?? 0) > 0;
}

/** ¿El usuario tiene este rol del personal? */
export function tieneRol(usuario: ConRoles, rol: RolPersonal): boolean {
  return usuario?.rolesPersonal.includes(rol) ?? false;
}

/** Permisos de una lista de roles: la suma, sin repetir, en el orden de NOMBRE_PERMISO. */
export function permisosDeRoles(roles: readonly RolPersonal[]): Permiso[] {
  const suma = new Set(roles.flatMap((rol) => PERMISOS_POR_ROL[rol]));
  return (Object.keys(NOMBRE_PERMISO) as Permiso[]).filter((permiso) => suma.has(permiso));
}

/** Permisos del usuario. Sin sesión, o de la comunidad, no hay ninguno. */
export function permisosDe(usuario: ConRoles): Permiso[] {
  return permisosDeRoles(usuario?.rolesPersonal ?? []);
}

/** ¿El usuario tiene este permiso? */
export function tienePermiso(usuario: ConRoles, permiso: Permiso): boolean {
  return permisosDe(usuario).includes(permiso);
}

/** "Facilitador · Gestor de espacios" para el personal; el tipo para la comunidad. */
export function describirRoles(usuario: Pick<Usuario, 'tipo' | 'rolesPersonal'>): string {
  if (usuario.rolesPersonal.length === 0) return NOMBRE_TIPO[usuario.tipo];
  return usuario.rolesPersonal.map((rol) => NOMBRE_ROL_PERSONAL[rol]).join(' · ');
}
