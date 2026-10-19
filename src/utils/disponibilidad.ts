/**
 * Cómo se ve cada estado de la disponibilidad de un espacio (HU-17, CA2).
 * Siempre con texto e ícono además del color. Los colores salen del tema, sin agregar ninguno.
 */
import { colores, coloresEstado } from '@/theme';
import type { EstadoFranja } from '@/types';
import type { TipoResumen } from '@/utils/calendario';

type Apariencia = { etiqueta: string; icono: string; fondo: string; texto: string };

/** Orden de la leyenda. */
export const ORDEN_ESTADOS_FRANJA: EstadoFranja[] = ['disponible', 'reservada', 'bloqueada', 'no_disponible'];

export const ESTADO_FRANJA: Record<EstadoFranja, Apariencia> = {
  disponible: {
    etiqueta: 'Disponible',
    icono: 'check-circle-outline',
    fondo: colores.primarioSuave,
    texto: colores.primario,
  },
  // Sin datos de quien reservó (CA3): solo el estado.
  reservada: {
    etiqueta: 'Reservada',
    icono: 'account-clock-outline',
    fondo: coloresEstado.nueva_fecha.fondo,
    texto: coloresEstado.nueva_fecha.texto,
  },
  bloqueada: {
    etiqueta: 'Bloqueada',
    icono: 'lock-outline',
    fondo: coloresEstado.rechazada.fondo,
    texto: coloresEstado.rechazada.texto,
  },
  no_disponible: {
    etiqueta: 'No disponible',
    icono: 'clock-remove-outline',
    fondo: colores.superficieVariante,
    texto: colores.textoSecundario,
  },
};

/** Ícono y color del resumen de un día en la tira de la semana y en el mes. */
export const RESUMEN_DIA: Record<TipoResumen, { icono: string; color: string }> = {
  con_libres: { icono: 'check-circle-outline', color: colores.primario },
  completo: { icono: 'minus-circle-outline', color: coloresEstado.nueva_fecha.texto },
  no_habil: { icono: 'close-circle-outline', color: colores.textoSecundario },
};
