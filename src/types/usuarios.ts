/**
 * Usuarios, roles y permisos (HU-05 y HU-07).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 */
import type { FirmaElectronica } from './tablets';

/** Tipo de usuario institucional: quién es en la universidad. */
export type TipoUsuario = 'estudiante' | 'docente' | 'administrativo' | 'egresado' | 'visitante';

/**
 * Roles del personal de la biblioteca: qué hace en la biblioteca. Una persona puede tener varios.
 * Administrador: una sola persona (la bibliotecóloga); los demás los asigna ella (HU-07).
 * No hay rol de préstamo de tablets: ese servicio lo maneja la administración (#200).
 * PROVISIONAL: los identificadores se confirman con Jorge y Rigoberto frente al portal web.
 */
export type RolPersonal = 'administrador' | 'facilitador' | 'gestor_espacios';

/** @deprecated Usa TipoUsuario o RolPersonal: el tipo de usuario y los roles del personal van separados. */
export type Rol = TipoUsuario | RolPersonal;

/**
 * Nivel de formación de la persona (formularios de la bibliotecóloga, versión 1.1).
 * 'otro' lo añadió el Backend (`OTHER` en `EducationLevelEnum`, #278).
 */
export type NivelFormacion = 'pregrado' | 'posgrado' | 'otro';

/**
 * La autorización de tratamiento de datos que aceptó una persona (#225): qué política y cuándo.
 * Como `privacy_acceptance_required` del Backend, es un dato del usuario, no del celular.
 */
export type AceptacionPolitica = {
  /** Fecha de la política aceptada; se compara con la vigente. */
  version: string;
  /** Momento de la aceptación, en ISO 8601. */
  fecha: string;
};

export type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  tipo: TipoUsuario;
  /** Vacío para la comunidad. */
  rolesPersonal: RolPersonal[];
  programa?: string;
  semestre?: number;
  /** Número de identificación, para las constancias y los formularios (versión 1.1). */
  identificacion?: string;
  nivel?: NivelFormacion;
  facultad?: string;
  sede?: string;
  /**
   * Dependencia de un docente o administrativo, opcional (#203; `department` en el registro del
   * Backend). Los estudiantes no la tienen.
   */
  dependencia?: string;
  /** Cargo del personal de la biblioteca; sale en la constancia del préstamo (versión 1.1). */
  cargo?: string;
  /**
   * Permisos que la administración le da a una persona aparte de sus roles (versión 1.1).
   * Por ahora solo `novedades`. No es un rol nuevo: se suma a los de `rolesPersonal`.
   */
  permisosExtra?: Permiso[];
  /**
   * La autorización de tratamiento de datos que aceptó al registrarse (revisión de la 1.1). Si la
   * Universidad publica otra política, la versión ya no coincide y se le pide otra vez.
   */
  aceptacionDatos?: AceptacionPolitica;
  /**
   * La firma del personal, registrada una vez en su Perfil (revisión de la 1.1). Se pone sola en
   * las constancias de las tablets que entrega o recibe. Sin ella, firma con su sesión.
   */
  firma?: FirmaElectronica;
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
  | 'estadisticas'
  /** Publicar avisos e informativos en Inicio, sin tocar los servicios (versión 1.1). */
  | 'novedades'
  /** Administrar las fotos del carrusel de Inicio (#290, #296). */
  | 'fotos';
