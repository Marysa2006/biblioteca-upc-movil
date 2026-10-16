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
};
