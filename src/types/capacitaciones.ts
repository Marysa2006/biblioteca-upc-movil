/**
 * Capacitaciones: líneas de formación y solicitudes (HU-09, HU-10 y HU-12).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 *
 * Las fechas van como texto 'AAAA-MM-DD' y las horas como 'HH:MM', como en los parámetros
 * de HU-28. El estado es el común de las solicitudes (EstadoSolicitud).
 */
import type { EstadoSolicitud } from './solicitudes';
import type { TipoUsuario } from './usuarios';

/** Modalidad de una capacitación (HU-10). */
export type ModalidadCapacitacion = 'presencial' | 'virtual';

/**
 * Línea de formación que ofrece la biblioteca (HU-09): el tema general al que se inscriben
 * las solicitudes. Al desactivarla deja de ofrecerse, pero conserva sus solicitudes.
 */
export type LineaFormacion = {
  id: string;
  nombre: string;
  descripcion: string;
  /** Solo las activas se ofrecen para solicitar (HU-10, CA1). */
  activa: boolean;
};

/**
 * Quién pide la capacitación (HU-10): los datos del solicitante en el momento de la solicitud.
 * Se guardan copiados, porque el perfil puede cambiar y la solicitud debe conservar lo que se pidió.
 */
export type SolicitanteCapacitacion = {
  id: string;
  nombre: string;
  tipo: TipoUsuario;
  /** Programa o dependencia; vacío si el perfil no lo tiene. */
  programa?: string;
};

/**
 * Solicitud de capacitación (HU-10 y HU-12).
 * - Nace `pendiente` al enviarla (HU-10, CA1).
 * - El personal la aprueba, rechaza o propone otra fecha (HU-12, CA1).
 * - Con `nueva_fecha`, el usuario la acepta o no (HU-12, CA4): al aceptar queda `aprobada`
 *   y al rechazar, `cancelada`.
 * - Al cerrarla, el personal deja el responsable y el resultado (HU-12, CA3).
 */
export type SolicitudCapacitacion = {
  id: string;
  lineaId: string;
  /** Nombre de la línea, para mostrarlo sin otra consulta. */
  linea: string;
  solicitante: SolicitanteCapacitacion;
  modalidad: ModalidadCapacitacion;
  /** Fecha y hora pedidas, 'AAAA-MM-DD' y 'HH:MM'. */
  fecha: string;
  hora: string;
  /** Qué quiere lograr con la capacitación. */
  objetivo: string;
  /** Grupo al que va dirigida: programa, curso o dependencia. */
  grupo: string;
  /** Cuántas personas asistirán. */
  participantes: number;
  estado: EstadoSolicitud;
  /**
   * Fecha y hora que propone el personal cuando el estado es `nueva_fecha` (HU-12, CA4).
   * Van juntas: si hay propuesta, las dos están.
   */
  fechaPropuesta?: string;
  horaPropuesta?: string;
  /** Persona del personal que atiende la solicitud (HU-12, CA3). */
  responsableId?: string;
  responsable?: string;
  /** Cómo terminó la capacitación (HU-12, CA3). */
  resultado?: string;
  /** Por qué se rechazó o se canceló; vacío mientras no aplique. */
  motivo?: string;
  /** Cuándo se creó, 'AAAA-MM-DD HH:MM'. */
  creada: string;
};
