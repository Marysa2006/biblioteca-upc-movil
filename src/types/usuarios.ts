/**
 * Usuarios, roles y permisos (HU-05 y HU-07).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 */

/**
 * Roles de la app. Desde 'administrador' pertenecen al personal de la biblioteca.
 * Administrador: una sola persona (la bibliotecóloga). Los demás roles del personal los asigna ella (HU-07).
 */
export type Rol =
  | 'visitante'
  | 'estudiante'
  | 'docente'
  | 'administrativo'
  | 'administrador'
  | 'facilitador'
  | 'gestor_espacios'
  | 'encargado_tablets';

export type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  programa?: string;
  semestre?: number;
};

/**
 * Permisos de la vista del personal (HU-07).
 * Cada rol del personal tiene un conjunto de permisos; la comunidad no administra
 * la biblioteca, así que no tiene ninguno. Los usa useRol() para mostrar u ocultar funciones.
 */
export type Permiso =
  | 'roles'
  | 'contenidos'
  | 'parametros'
  | 'espacios'
  | 'reservas'
  | 'asesorias'
  | 'tablets'
  | 'formacion'
  | 'estadisticas';
