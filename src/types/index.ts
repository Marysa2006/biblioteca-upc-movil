/**
 * Tipos compartidos entre pantallas, hooks y API.
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 * Cuando el Backend publique su API, estos tipos deben coincidir con lo que devuelve.
 */

/** Roles de la app. Los dos últimos pertenecen al personal de la biblioteca. */
export type Rol =
  | 'visitante'
  | 'estudiante'
  | 'docente'
  | 'administrativo'
  | 'administrador'
  | 'facilitador';

export type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  programa?: string;
  semestre?: number;
};

export type CategoriaServicio =
  | 'asesorias'
  | 'capacitaciones'
  | 'espacios'
  | 'tablets'
  | 'repositorio'
  | 'prestamo'
  | 'cultura';

/** Servicio de la biblioteca (HU-01). */
export type Servicio = {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaServicio;
  publico: string;
  formaSolicitud: string;
  horario: string;
  requiereCuenta: boolean;
  activo: boolean;
};

/** Base de datos o recurso académico externo (HU-03). */
export type Recurso = {
  id: string;
  nombre: string;
  descripcion: string;
  url: string;
  requiereCuenta: boolean;
};

/** Estado común de todas las solicitudes (capacitaciones, asesorías, reservas, tablets). */
export type EstadoSolicitud =
  | 'pendiente'
  | 'aprobada'
  | 'rechazada'
  | 'nueva_fecha'
  | 'cancelada'
  | 'realizada';

/** Datos que el usuario completa o actualiza; no vienen de la cuenta institucional (HU-06). */
export type DatosEditablesPerfil = {
  telefono?: string;
  /**
   * Dirección: PROVISIONAL. No está en el esquema del Backend (`core_user`); se confirma
   * con la biblioteca y el equipo de Backend antes de conectar la API real.
   */
  direccion?: string;
};

/**
 * Perfil del usuario autenticado (HU-06): datos institucionales de solo lectura
 * más los datos editables.
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 */
export type Perfil = Usuario & DatosEditablesPerfil;
