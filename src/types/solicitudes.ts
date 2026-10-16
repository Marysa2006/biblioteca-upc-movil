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
