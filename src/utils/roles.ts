import type { Rol } from '@/types';

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
