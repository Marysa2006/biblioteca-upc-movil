/**
 * Control de asistencia con QR (HU-33, función plus).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 *
 * Las fechas van como texto 'AAAA-MM-DD' y las horas como 'HH:MM', como en los parámetros
 * de HU-28. La asistencia se lleva sobre las citas de asesoría (HU-15).
 */

/** Cómo se registró la asistencia. */
export type MedioAsistencia = 'qr' | 'manual';

/**
 * Código temporal de una sesión (HU-33, CA1): el facilitador lo muestra como QR y solo sirve
 * para esa sesión y hasta que vence.
 */
export type CodigoAsistencia = {
  /** Sesión (la cita de asesoría) a la que pertenece. */
  sesionId: string;
  /** Contenido del QR. Es temporal: cambia cada vez que se abre la asistencia. */
  codigo: string;
  /** Cuándo deja de servir, 'AAAA-MM-DD HH:MM'. */
  vence: string;
  /** Si la asistencia ya se cerró, el código no acepta más registros (CA4). */
  cerrada: boolean;
};

/**
 * Una persona que registró su asistencia (HU-33, CA2 y CA3): quién, a qué hora y si fue con
 * el QR o marcada a mano por el facilitador.
 */
export type RegistroAsistencia = {
  id: string;
  sesionId: string;
  usuarioId: string;
  nombre: string;
  tipoUsuario?: string;
  programa?: string;
  /** 'AAAA-MM-DD HH:MM'. */
  fechaHora: string;
  medio: MedioAsistencia;
};

/** La asistencia de una sesión: el código vigente y quiénes se han registrado (CA2). */
export type AsistenciaSesion = {
  sesionId: string;
  /** null cuando la asistencia está cerrada o aún no se ha abierto. */
  codigo: CodigoAsistencia | null;
  registros: RegistroAsistencia[];
  /** Total de asistentes, para no contarlo en cada pantalla. */
  total: number;
};
