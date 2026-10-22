/**
 * Claves de consulta (queryKey) de TanStack Query, en un solo lugar.
 *
 * Así los hooks no inventan cada uno su clave y las mutaciones invalidan lo mismo que
 * consultan las pantallas. Las claves de la iteración 1 quedaron aquí centralizadas y las
 * de la iteración 2 se suman desde el contrato de tipos.
 */
import type { EstadoSolicitud } from '@/types';

export const claves = {
  // ── Iteración 1 ──────────────────────────────────────────────
  servicios: ['servicios'] as const,
  servicio: (id: string) => ['servicios', id] as const,
  serviciosAdministracion: ['servicios', 'administracion'] as const,
  contenidos: ['contenidos'] as const,
  parametros: ['parametros'] as const,
  usuarios: ['usuarios'] as const,
  recursos: ['recursos'] as const,
  /** El id va dentro de la clave: la caché es por usuario. */
  perfil: (usuarioId?: string) => ['perfil', usuarioId] as const,

  // ── Iteración 2 ──────────────────────────────────────────────
  espacios: ['espacios'] as const,
  espacio: (id: string) => ['espacios', id] as const,
  espaciosAdministracion: ['espacios', 'administracion'] as const,
  /** Reservas futuras de un espacio, para advertir al desactivarlo (HU-16, CA3). */
  espacioReservas: (id: string) => ['espacios', id, 'reservas'] as const,
  /** Disponibilidad de un espacio (HU-17), con o sin rango de fechas. */
  disponibilidad: (espacioId: string, desde?: string, hasta?: string) =>
    ['disponibilidad', espacioId, desde ?? null, hasta ?? null] as const,
  /** Prefijo para invalidar la disponibilidad de todos los espacios a la vez. */
  disponibilidadTodas: ['disponibilidad'] as const,
  reservas: ['reservas'] as const,
  /** Solicitudes de reserva por estado, para la bandeja (HU-19). */
  reservasPorEstado: (estado: EstadoSolicitud | 'todas') => ['reservas', estado] as const,
  /** Reservas del usuario de la sesión, por fecha (HU-27 y HU-08). */
  misReservas: (usuarioId?: string) => ['reservas', 'mias', usuarioId] as const,
  bloqueos: ['bloqueos'] as const,
  bloqueosDeEspacio: (espacioId: string) => ['bloqueos', espacioId] as const,
  notificaciones: ['notificaciones'] as const,

  // ── Iteración 3: asesorías (HU-13, HU-14 y HU-15) ────────────
  temasAsesoria: ['asesorias', 'temas'] as const,
  temaAsesoria: (id: string) => ['asesorias', 'temas', id] as const,
  jornadasAsesoria: ['asesorias', 'jornadas'] as const,
  jornadaAsesoria: (id: string) => ['asesorias', 'jornadas', id] as const,
  /** Franjas de un tema en un rango de fechas (HU-14). */
  franjasAsesoria: (temaId: string, desde?: string, hasta?: string) =>
    ['asesorias', 'franjas', temaId, desde ?? null, hasta ?? null] as const,
  citasAsesoria: ['asesorias', 'citas'] as const,
  citasPorEstado: (estado: EstadoSolicitud | 'todas') => ['asesorias', 'citas', estado] as const,
  /** Citas del usuario de la sesión (HU-14). */
  misCitas: (usuarioId?: string) => ['asesorias', 'citas', 'mias', usuarioId] as const,
  /** Agenda del facilitador por rango de fechas (HU-15). */
  agendaFacilitador: (facilitadorId: string, desde?: string, hasta?: string) =>
    ['asesorias', 'agenda', facilitadorId, desde ?? null, hasta ?? null] as const,

  // ── Iteración 3: tablets (HU-21, HU-22, HU-23 y HU-24) ───────
  tablets: ['tablets'] as const,
  tablet: (id: string) => ['tablets', id] as const,
  condicionesTablet: ['tablets', 'condiciones'] as const,
  prestamosTablet: ['prestamos'] as const,
  prestamosPorEstado: (estado: EstadoSolicitud | 'todas') => ['prestamos', estado] as const,
  /** Préstamos del usuario de la sesión (HU-22). */
  misPrestamos: (usuarioId?: string) => ['prestamos', 'mios', usuarioId] as const,
  /** Préstamos pasados de la hora límite (HU-24). */
  prestamosVencidos: ['prestamos', 'vencidos'] as const,

  // ── Función plus: guías sin conexión (HU-29) ─────────────────
  guias: ['guias'] as const,
  guia: (id: string) => ['guias', id] as const,
  guiasGuardadas: ['guias', 'guardadas'] as const,
};
