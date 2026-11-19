/**
 * Las secciones de Gestión: su nombre y con qué permisos se ven. Funciones puras, sin hooks.
 * Las usan la pantalla de Gestión, que les pone su componente, y el tutorial del personal
 * (#267), que muestra solo las que la persona tiene. Así, si cambia quién ve una sección,
 * cambia en los dos lugares a la vez.
 */
import type { Permiso } from '@/types';

export type ValorSeccionGestion =
  'solicitudes' | 'agenda' | 'prestamos' | 'vencidos' | 'espacios' | 'portal';

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
  { valor: 'prestamos', etiqueta: 'Préstamos', permisos: ['tablets'] },
  { valor: 'vencidos', etiqueta: 'Vencidos', permisos: ['tablets'] },
  { valor: 'espacios', etiqueta: 'Espacios', permisos: ['espacios'] },
  // `novedades` (#257): quien solo publica avisos también entra al Portal, solo a lo suyo.
  { valor: 'portal', etiqueta: 'Portal', permisos: ['contenidos', 'parametros', 'novedades'] },
];

/** Las secciones que se ven con estos permisos, en su orden. */
export function seccionesGestionVisibles(
  tienePermiso: (permiso: Permiso) => boolean,
): InfoSeccionGestion[] {
  return SECCIONES_GESTION.filter((seccion) => seccion.permisos.some(tienePermiso));
}
