/**
 * Parámetros generales (HU-28).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 */

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
  /**
   * Horas máximas de un préstamo de tablet (versión 1.1). Vale 4, como el Backend
   * (`tablet-max-loan-hours`); la biblioteca lo ajusta en Parámetros.
   */
  horasMaximasPrestamo: number;
  /** Horas de un préstamo de tablet cuando la persona no elige otra cosa. */
  horasPrestamoTablet: number;
  /** Días de anticipación con que se puede apartar una tablet (`tablet-max-days-ahead`). */
  diasMaximosTablet: number;
  /** Minutos que la persona tiene para recoger la tablet antes de que se libere. */
  minutosRecogerTablet: number;
  /** Duración de una asesoría, en minutos (`advisory-duration-minutes`). */
  duracionAsesoriaMinutos: number;
  /** Personas como máximo en una asesoría (`advisory-max-group`); más, se pide capacitación. */
  maximoPersonasAsesoria: number;
  /** Horas que vale el QR de asistencia desde que empieza la sesión (`attendance-qr-hours`). */
  horasVigenciaQr: number;
};
