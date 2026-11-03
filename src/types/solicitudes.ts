/**
 * Solicitudes de servicios.
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 */

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
