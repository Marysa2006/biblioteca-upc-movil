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

/** Periodo académico configurable (HU-28). Fechas en formato ISO 'AAAA-MM-DD'. */
export type PeriodoAcademico = {
  id: string;
  nombre: string;
  inicio: string;
  fin: string;
};

/** Día festivo configurable (HU-28). */
export type Festivo = {
  fecha: string;
  motivo: string;
};

/** Franja de atención de un día de la semana (HU-28). dia: 0 = domingo … 6 = sábado. */
export type HorarioAtencion = {
  dia: number;
  abre: string;
  cierra: string;
};

/** Parámetros generales que adaptan el funcionamiento de los servicios (HU-28). */
export type Parametros = {
  periodos: PeriodoAcademico[];
  festivos: Festivo[];
  horarios: HorarioAtencion[];
  /** Tiempo mínimo, en horas, para solicitar un servicio. */
  horasMinimasSolicitud: number;
  /** Tiempo mínimo, en horas, para cancelar una solicitud. */
  horasMinimasCancelacion: number;
  /** Textos de las comunicaciones automáticas. */
  textoRecordatorio: string;
  textoCancelacion: string;
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
