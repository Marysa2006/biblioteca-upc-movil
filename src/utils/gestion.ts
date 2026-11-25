/**
 * Las secciones de Gestión: su nombre y con qué permisos se ven. Funciones puras, sin hooks.
 * Las usan la pantalla de Gestión, que les pone su componente, y el tutorial del personal
 * (#267), que muestra solo las que la persona tiene. Así, si cambia quién ve una sección,
 * cambia en los dos lugares a la vez.
 */
import type { Permiso } from '@/types';

export type ValorSeccionGestion =
  'solicitudes' | 'agenda' | 'prestamos' | 'portal';

export type InfoSeccionGestion = {
  valor: ValorSeccionGestion;
  etiqueta: string;
  /** Se ve con cualquiera de estos permisos. */
  permisos: readonly Permiso[];
};

/** En el orden en que aparecen en Gestión. */
export const SECCIONES_GESTION: readonly InfoSeccionGestion[] = [
  {
    valor: 'solicitudes',
    etiqueta: 'Solicitudes',
    permisos: ['reservas', 'asesorias', 'formacion'],
  },
  { valor: 'agenda', etiqueta: 'Agenda', permisos: ['asesorias'] },
  // Los vencidos son un grupo de Préstamos desde el #310 (antes, su propia sección).
  { valor: 'prestamos', etiqueta: 'Préstamos', permisos: ['tablets'] },
  // Con un permiso adicional (`novedades`, `fotos` o `parametros`, #257 y #296) también se entra
  // al Portal, solo a lo suyo. Desde la revisión de la 1.1, Espacios es una fila del Portal (grupo
  // Servicios), así que `espacios` también deja entrar.
  {
    valor: 'portal',
    etiqueta: 'Portal',
    permisos: ['contenidos', 'parametros', 'novedades', 'fotos', 'espacios'],
  },
];

/** Las secciones que se ven con estos permisos, en su orden. */
export function seccionesGestionVisibles(
  tienePermiso: (permiso: Permiso) => boolean,
): InfoSeccionGestion[] {
  return SECCIONES_GESTION.filter((seccion) => seccion.permisos.some(tienePermiso));
}
