/**
 * Equivalencias entre los valores del Backend (en inglés y en mayúsculas) y los de la app.
 * Funciones y tablas puras: las usan los adaptadores de src/api/backend/.
 *
 * Fuente: el esquema de la API 2.1.0 (`docs/schema.yml` del Backend) y las respuestas de Render
 * (fase 0 de la integración, 24 de noviembre de 2026). Aquí se irán sumando los días de la semana
 * y los estados de las solicitudes cuando se conecten esos módulos.
 */
import type { EstadoSolicitud, Permiso, RolPersonal, TipoUsuario } from '@/types';

/** Estados de una solicitud en el Backend (`RequestStatus`). */
export type EstadoBackend =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'RESCHEDULE_PROPOSED'
  | 'IN_PROGRESS'
  | 'OVERDUE'
  | 'COMPLETED';

/**
 * El estado de la app. El Backend tiene dos más: `IN_PROGRESS` (la reserva o el préstamo en curso)
 * y `OVERDUE` (el préstamo vencido) siguen ocupando, así que cuentan como `aprobada`; el préstamo
 * de tablet los lee aparte para decir «entregado» o «vencido».
 */
export const ESTADO_DESDE_BACKEND: Record<EstadoBackend, EstadoSolicitud> = {
  PENDING: 'pendiente',
  APPROVED: 'aprobada',
  REJECTED: 'rechazada',
  CANCELLED: 'cancelada',
  RESCHEDULE_PROPOSED: 'nueva_fecha',
  IN_PROGRESS: 'aprobada',
  OVERDUE: 'aprobada',
  COMPLETED: 'realizada',
};

/** Tipos de usuario del Backend (`UserType`). No tiene egresados: se dejó para después. */
export type TipoUsuarioBackend = 'STUDENT' | 'TEACHER' | 'ADMINISTRATIVE';

export const TIPO_DESDE_BACKEND: Record<TipoUsuarioBackend, TipoUsuario> = {
  STUDENT: 'estudiante',
  TEACHER: 'docente',
  ADMINISTRATIVE: 'administrativo',
};

/**
 * Día de la semana. El Backend (`DayOfWeek`) cuenta desde el lunes: `0` = lunes … `6` = domingo.
 * La app, como `Date.getDay()`: `0` = domingo … `6` = sábado.
 */
export function diaDesdeBackend(dia: number): number {
  return (dia + 1) % 7;
}

export function diaHaciaBackend(dia: number): number {
  return (dia + 6) % 7;
}

/** Hora del Backend (`'07:00:00'`) como la usa la app (`'07:00'`). */
export function horaDesdeBackend(hora: string): string {
  return hora.slice(0, 5);
}

/** Sedes del Backend (`Campus`); la app usa los nombres de `SEDES`. */
export type SedeBackend = 'VALLEDUPAR' | 'AGUACHICA';

const SEDE_DESDE_BACKEND: Record<SedeBackend, string> = {
  VALLEDUPAR: 'Valledupar',
  AGUACHICA: 'Aguachica',
};

/** La sede como la escribe la app, o undefined si no tiene (el Backend manda `''`). */
export function sedeDesdeBackend(sede: string | null | undefined): string | undefined {
  return sede && sede in SEDE_DESDE_BACKEND ? SEDE_DESDE_BACKEND[sede as SedeBackend] : undefined;
}

/** La sede para el Backend, o undefined si la app no la conoce. */
export function sedeHaciaBackend(sede: string | undefined): SedeBackend | undefined {
  const entrada = Object.entries(SEDE_DESDE_BACKEND).find(([, nombre]) => nombre === sede);
  return entrada?.[0] as SedeBackend | undefined;
}

/** Los roles del personal llegan por código (`Role.code`), los mismos de la app. */
const ROLES_PERSONAL: readonly RolPersonal[] = ['administrador', 'facilitador', 'gestor_espacios'];

/** Solo los roles que la app conoce, sin repetir. */
export function rolesDesdeBackend(roles: readonly string[]): RolPersonal[] {
  return ROLES_PERSONAL.filter((rol) => roles.includes(rol));
}

/**
 * Los permisos adicionales por persona (`extra_permissions`, #296) y su permiso en la app. Solo
 * estos tres se pueden dar aparte de los roles.
 */
const PERMISO_EXTRA_DESDE_BACKEND: Record<string, Permiso> = {
  'portal.manage_content': 'novedades',
  'portal.manage_home_photos': 'fotos',
  'system_config.manage_parameters': 'parametros',
};

export function permisosExtraDesdeBackend(permisos: readonly string[]): Permiso[] {
  return permisos
    .map((permiso) => PERMISO_EXTRA_DESDE_BACKEND[permiso])
    .filter((permiso): permiso is Permiso => permiso != null);
}
