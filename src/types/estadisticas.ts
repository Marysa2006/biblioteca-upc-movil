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
  total: number;
  porServicio: ConteoIndicador[];
  porTipoUsuario: ConteoIndicador[];
  porPrograma: ConteoIndicador[];
  /** Un elemento por mes con datos, 'AAAA-MM', en orden. */
  porMes: ConteoIndicador[];
};
