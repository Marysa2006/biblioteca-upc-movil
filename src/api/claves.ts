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
  /** Disponibilidad de un espacio (HU-17), con o sin rango de fechas. */
  disponibilidad: (espacioId: string, desde?: string, hasta?: string) =>
    ['disponibilidad', espacioId, desde ?? null, hasta ?? null] as const,
  /** Prefijo para invalidar la disponibilidad de todos los espacios a la vez. */
  disponibilidadTodas: ['disponibilidad'] as const,
  reservas: ['reservas'] as const,
  /** Solicitudes de reserva por estado, para la bandeja (HU-19). */
  reservasPorEstado: (estado: EstadoSolicitud | 'todas') => ['reservas', estado] as const,
  bloqueos: ['bloqueos'] as const,
  bloqueosDeEspacio: (espacioId: string) => ['bloqueos', espacioId] as const,
  notificaciones: ['notificaciones'] as const,
};
