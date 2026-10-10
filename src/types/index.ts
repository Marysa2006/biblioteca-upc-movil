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
