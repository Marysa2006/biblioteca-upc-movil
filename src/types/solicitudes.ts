/**
 * Solicitudes de servicios.
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 */

import type { NivelFormacion, TipoUsuario } from './usuarios';

/** Estado común de todas las solicitudes (capacitaciones, asesorías, reservas, tablets). */
export type EstadoSolicitud =
  | 'pendiente'
  | 'aprobada'
  | 'rechazada'
  | 'nueva_fecha'
  | 'cancelada'
  | 'realizada';

/** Los cuatro servicios que reúne «Mis solicitudes» (HU-08). */
export type TipoSolicitud = 'reserva' | 'cita' | 'prestamo' | 'capacitacion';

/**
 * Una solicitud vista desde «Mis solicitudes» (HU-08, CA1): lo justo para la lista, sin
 * importar de qué servicio venga. El detalle se abre con `tipo` e `id`.
 */
export type ResumenSolicitud = {
  id: string;
  tipo: TipoSolicitud;
  /** Qué se pidió: "Sala de Reuniones", "Normas APA 7", "Tablet Samsung A9"… */
  titulo: string;
  /** 'AAAA-MM-DD' del servicio. */
  fecha: string;
  /** 'HH:MM'; vacío si la solicitud no tiene hora (por ejemplo, una capacitación sin definir). */
  hora?: string;
  estado: EstadoSolicitud;
};

/**
 * Un paso del historial de una solicitud (HU-08, CA2). Se crea en cada cambio de estado:
 * quién lo hizo, cuándo, a qué estado y con qué nota.
 */
export type EventoSolicitud = {
  id: string;
  /** 'AAAA-MM-DD HH:MM'. */
  fecha: string;
  estado: EstadoSolicitud;
  /** Quién hizo el cambio: el personal o el solicitante. */
  autor: string;
  /** Nota del cambio: el motivo del rechazo, el resultado, la fecha propuesta… */
  nota?: string;
};

/**
 * Datos de quien pide un servicio, copiados en la solicitud (versión 1.1).
 * Se guardan en el momento de pedir porque el perfil puede cambiar y la solicitud debe conservar
 * lo que se pidió. Lo que la sesión ya sabe llega prellenado al formulario.
 */
export type DatosSolicitante = {
  tipo: TipoUsuario;
  /** Nombre y apellidos, como se pide en los formularios de la biblioteca. */
  nombreCompleto: string;
  identificacion: string;
  correo: string;
  celular: string;
  nivel?: NivelFormacion;
  /** La sede de la persona, una de SEDES (#251); obligatoria para estudiantes. */
  sede?: string;
  facultad?: string;
  programa?: string;
  semestre?: number;
};

/**
 * Calificación de la calidad del servicio (versión 1.1). La pide la bibliotecóloga al terminar
 * la asesoría o la capacitación, junto con la asistencia.
 */
export type Calificacion = {
  /** De 1 a 5. */
  puntaje: number;
  comentario?: string;
  /** 'AAAA-MM-DD'. */
  fecha: string;
};
