/**
 * Usuarios, roles y permisos (HU-05 y HU-07).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 */

/** Tipo de usuario institucional: quién es en la universidad. */
export type TipoUsuario = 'estudiante' | 'docente' | 'administrativo' | 'egresado' | 'visitante';

/**
 * Roles del personal de la biblioteca: qué hace en la biblioteca. Una persona puede tener varios.
 * Administrador: una sola persona (la bibliotecóloga); los demás los asigna ella (HU-07).
 * PROVISIONAL: los identificadores se confirman con Jorge y Rigoberto frente al portal web.
 */
export type RolPersonal = 'administrador' | 'facilitador' | 'gestor_espacios' | 'encargado_tablets';

/** @deprecated Usa TipoUsuario o RolPersonal: el tipo de usuario y los roles del personal van separados. */
export type Rol = TipoUsuario | RolPersonal;

export type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  tipo: TipoUsuario;
  /** Vacío para la comunidad. */
  rolesPersonal: RolPersonal[];
  programa?: string;
  semestre?: number;
};

/**
 * Permisos de la vista del personal (HU-07). Los de una persona son la suma de los de sus roles.
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
