/**
 * Estadísticas de uso (HU-25 y HU-26).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 *
 * Las fechas van como texto 'AAAA-MM-DD'. La captura real es del Backend; en la app se
 * registran los datos de prueba al completar cada operación.
 */
import type { TipoUsuario } from './usuarios';

/** Servicios de la biblioteca que se pueden contar en las estadísticas. */
export type ServicioEstadistica =
  | 'espacios'
  | 'asesorias'
  | 'tablets'
  | 'capacitaciones'
  | 'guias'
  | 'catalogo';

/** Modalidad de la operación registrada. */
export type ModalidadUso = 'presencial' | 'virtual';

/** Resultado de la operación: se completó, se canceló o quedó pendiente. */
export type EstadoUso = 'completada' | 'cancelada' | 'pendiente';

/**
 * Lo que no se conoce de la persona o de la operación se guarda como 'no_informado'
 * (HU-25, CA2). Un dato ausente nunca se deja vacío: así los reportes pueden sumar todo.
 */
export const NO_INFORMADO = 'no_informado';

/** Valor que puede faltar: el dato real o 'no_informado'. */
export type DatoUso = string;

/**
 * Registro de una operación (HU-25, CA1): quién, de qué tipo, de qué programa, qué servicio,
 * para qué, cuándo, con qué modalidad y cómo terminó. Es la base de los indicadores de HU-26.
 */
export type RegistroUso = {
  id: string;
  /** Usuario que hizo la operación; 'no_informado' si no hay sesión (por ejemplo, un visitante). */
  usuarioId: DatoUso;
  nombre: DatoUso;
  tipoUsuario: TipoUsuario | typeof NO_INFORMADO;
  programa: DatoUso;
  servicio: ServicioEstadistica;
  /** Para qué se usó el servicio (finalidad), si la persona lo dijo. */
  finalidad: DatoUso;
  /** 'AAAA-MM-DD'. Se registra el día de la operación. */
  fecha: string;
  /** 'AAAA-MM-DD' del fin, si la operación abarca varios días (por ejemplo, un préstamo). */
  fechaFin?: string;
  modalidad: ModalidadUso | typeof NO_INFORMADO;
  estado: EstadoUso;

  // ── Versión 1.1: cruces y filtros nuevos (#259) ────────────
  facultad: DatoUso;
  sede: DatoUso;
  semestre: DatoUso;
  /** Calificación que dejó la persona, de 1 a 5; si no calificó, no viene. */
  calificacion?: number;

  // ── Versión 1.1: calidad en tiempos y temáticas (#307) ────
  /**
   * Tema de la asesoría o línea de formación de la capacitación: las «temáticas» que pidió la
   * bibliotecóloga. Los demás servicios no la tienen.
   */
  tematica?: string;
  /** Cuándo se pidió, en ISO 8601 con hora (`toISOString()`). */
  solicitadaEl?: string;
  /**
   * Cuándo la respondió el personal por primera vez (aprobó, rechazó o propuso otra fecha), en
   * ISO 8601 con hora. Solo en los servicios que se aprueban: espacios, asesorías y capacitaciones.
   */
  respondidaEl?: string;
  /**
   * Solo en las tablets: horas entre la entrega y la devolución, si se registraron las dos (#307).
   * Un préstamo devuelto sin ellas cuenta como «sin hora completa».
   */
  duracionHoras?: number;
};

/**
 * Filtros de HU-26 (CA1). Todos son opcionales: sin filtros se cuenta todo.
 * `desde` y `hasta` son 'AAAA-MM-DD' e incluyen esos días.
 */
export type FiltrosEstadisticas = {
  desde?: string;
  hasta?: string;
  servicio?: ServicioEstadistica | 'todos';
  tipoUsuario?: TipoUsuario | typeof NO_INFORMADO | 'todos';
  programa?: DatoUso | 'todos';
  facultad?: DatoUso | 'todos';
  sede?: DatoUso | 'todos';
  /**
   * @deprecated Desde la versión 1.1 el cruce de tiempo es el **periodo** (`AAAA-1` / `AAAA-2`),
   * como `by_semester` del Backend (#278). El semestre del estudiante sigue en el CSV, pero ya no
   * es un filtro.
   */
  semestre?: DatoUso | 'todos';
  /** Periodo académico: `AAAA-1` (enero a junio) o `AAAA-2` (julio a diciembre), #278. */
  periodo?: string | 'todos';
};

/** Un grupo de un indicador: su nombre y cuántos registros tiene. */
export type ConteoIndicador = {
  etiqueta: string;
  cantidad: number;
};

/**
 * Indicadores de uso (HU-26, CA1): el total y los conteos por servicio, tipo de usuario,
 * programa y mes. Sin datos, el total es 0 y las listas van vacías (CA3).
 */
export type IndicadoresUso = {
  usuariosUnicos?: number;
  asistentes?: number;
  asistentesPorServicio?: ConteoIndicador[];
  porDiaSemana?: ConteoIndicador[];
  porTematica?: ConteoIndicador[];
  total: number;
  porServicio: ConteoIndicador[];
  porTipoUsuario: ConteoIndicador[];
  porPrograma: ConteoIndicador[];
  /** Un elemento por mes con datos, 'AAAA-MM', en orden. */
  porMes: ConteoIndicador[];

  // ── Versión 1.1 (#259) ─────────────────────────────────────
  porFacultad: ConteoIndicador[];
  porSede: ConteoIndicador[];
  /**
   * @deprecated Desde la versión 1.1 este cruce es el **periodo** (`AAAA-1` / `AAAA-2`), como
   * `by_semester` del Backend (#278): usa `porPeriodo`. Se conserva con el mismo contenido para
   * no romper a quien ya lo lee.
   */
  porSemestre: ConteoIndicador[];
  /** Un elemento por periodo con datos, `AAAA-1` o `AAAA-2`, en orden (#278). */
  porPeriodo: ConteoIndicador[];
  /** Promedio de las calificaciones recibidas; no viene si nadie calificó. */
  calificacionPromedio?: number;

  // ── Versión 1.1: lo que pidió la bibliotecóloga (#307) ────
  /** Completadas, canceladas y pendientes. */
  porEstado: ConteoIndicador[];
  /** Presencial y virtual. */
  porModalidad: ConteoIndicador[];
  /**
   * Temáticas, aparte para no confundir nombres parecidos («Normas APA y Turnitin» es un tema;
   * «Normas APA», una línea): por tema de asesoría y por línea de formación.
   */
  porTemaAsesoria: ConteoIndicador[];
  porLineaFormacion: ConteoIndicador[];
  /** Tiempo promedio de respuesta del personal, por servicio; solo los que tienen respuesta. */
  tiempoRespuesta: TiempoRespuesta[];
  /** La pestaña Tablets, como el tablero de Análisis de datos (#307). */
  tablets: IndicadoresTablets;
};

/** Préstamos de tablets: cuántos, cuánto duran y si cumplen la duración de referencia (#307). */
export type IndicadoresTablets = {
  prestamos: number;
  /** Devueltos con la hora de entrega y de devolución. */
  conDuracion: number;
  /** Duración promedio en horas, con un decimal; no viene si ninguno tiene las dos horas. */
  duracionPromedio?: number;
  /** La duración de un préstamo en los parámetros (`horasPrestamoTablet`). */
  horasReferencia: number;
  /** Cuántos de los que tienen duración duraron esas horas o menos. */
  dentroDeReferencia: number;
  /** Devueltos sin la hora de entrega o de devolución: calidad de los datos. */
  sinHoraCompleta?: number;
  menosDeUnaHora?: number;
  porMes: ConteoIndicador[];
  porPrograma: ConteoIndicador[];
};

/** Cuánto tarda el personal en responder las solicitudes de un servicio (#307). */
export type TiempoRespuesta = {
  servicio: ServicioEstadistica;
  /** Nombre del servicio para mostrar. */
  etiqueta: string;
  /** Promedio en horas, con un decimal. */
  horasPromedio: number;
  /** Cuántas solicitudes respondidas entran en el promedio. */
  cantidad?: number;
};
