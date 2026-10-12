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

/** Tipo de contenido editable del portal (HU-04). */
export type TipoContenido = 'servicio' | 'informativo' | 'aviso';

/**
 * Contenido del portal que el administrador puede crear, editar, publicar,
 * ocultar y ordenar sin tocar el código (HU-04).
 */
export type Contenido = {
  id: string;
  tipo: TipoContenido;
  titulo: string;
  descripcion: string;
  publicado: boolean;
  orden: number;
  /** Vigencia opcional, sobre todo para los avisos. */
  fechaInicio?: string;
  fechaFin?: string;
};

/** Aviso del portal (HU-04): un contenido de tipo aviso. */
export type Aviso = Contenido & { tipo: 'aviso' };
