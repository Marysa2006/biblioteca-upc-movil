/**
 * Notificaciones y recordatorios (HU-27).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 *
 * En la app se muestran como avisos dentro de la aplicación; los recordatorios se
 * programan como notificaciones locales del celular. El correo lo envía el Backend.
 */

/** Aviso sobre una solicitud, dentro de la app (HU-27). */
export type Notificacion = {
  id: string;
  /** Usuario que la recibe. */
  usuarioId: string;
  titulo: string;
  mensaje: string;
  /** Cuándo se generó, 'AAAA-MM-DD HH:MM'. */
  fecha: string;
  /** Si el usuario ya la vio. */
  leida: boolean;
  /** Solicitud a la que se refiere (HU-18, HU-19). */
  solicitudId: string;
};
