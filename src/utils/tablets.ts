/**
 * Reglas de las tablets: el inventario (HU-21, CA3), la entrega/devolución (HU-23)
 * y la solicitud de préstamo (HU-22).
 * Funciones puras, sin hooks.
 */
import { z } from 'zod';

import type { CondicionTablet, EstadoTablet, Parametros, Prestamo, Tablet } from '@/types';
import { sumarDias } from '@/utils/calendario';
import { motivoNoDisponible } from '@/utils/parametros';

/** Una tablet está operativa si no está en mantenimiento ni de baja. */
export function estaOperativa(tablet: Tablet): boolean {
  return tablet.estado !== 'mantenimiento' && tablet.estado !== 'de_baja';
}

/** Tablets que se pueden prestar: operativas y libres (HU-21, CA3). */
export function tabletsDisponibles(tablets: Tablet[]): Tablet[] {
  return tablets.filter((tablet) => tablet.estado === 'disponible');
}

/** Fecha y hora del momento en el formato del contrato: 'AAAA-MM-DD HH:MM'. */
export function ahoraFechaHora(ahora: Date = new Date()): string {
  const dos = (numero: number) => String(numero).padStart(2, '0');
  return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())} ${dos(
    ahora.getHours(),
  )}:${dos(ahora.getMinutes())}`;
}

/**
 * Minutos de retraso de una devolución (HU-23, CA4): 0 si llegó antes de la hora límite.
 * Se redondea hacia arriba para no perder un retraso de pocos segundos.
 */
export function minutosDeRetraso(prestamo: Prestamo, ahora: Date = new Date()): number {
  const limite = new Date(`${prestamo.fecha}T${prestamo.horaLimite}:00`);
  const diferencia = ahora.getTime() - limite.getTime();
  return diferencia > 0 ? Math.ceil(diferencia / 60000) : 0;
}

/** Estado de la tablet al entregarla (HU-23): queda en préstamo. */
export function estadoTabletAlEntregar(): EstadoTablet {
  return 'en_prestamo';
}

/** Estado de la tablet al devolverla (HU-23): mantenimiento si se dañó; disponible si no. */
export function estadoTabletAlDevolver(condicion: CondicionTablet): EstadoTablet {
  return condicion === 'danado' ? 'mantenimiento' : 'disponible';
}

// ── Solicitud de préstamo (HU-22) ─────────────────────────────────────────────────────
// Sin tablets en una franja, se sugieren las más cercanas que sí tienen (CA2).
// Sin aceptar las condiciones de uso, la solicitud no se envía (CA3); la API vuelve a validar.

/**
 * PROVISIONAL: franja de un día con las tablets que quedan libres. Falta en el contrato
 * (src/types/tablets.ts); cuando exista, este tipo se cambia por el del contrato.
 */
export type FranjaTablet = {
  /** 'HH:MM'. */
  horaInicio: string;
  /** Hora límite para devolver, 'HH:MM' del mismo día. */
  horaLimite: string;
  libres: number;
};

/** "Quedan 2 tablets", "Queda 1 tablet" o "Sin tablets". */
export function textoLibres(libres: number): string {
  if (libres <= 0) return 'Sin tablets';
  return libres === 1 ? 'Queda 1 tablet' : `Quedan ${libres} tablets`;
}

const enMinutos = (hora: string) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

const MAXIMO_SUGERIDAS = 3;

/** CA2: hasta 3 franjas con tablets, las más cercanas a la consultada, en orden de hora. */
export function franjasSugeridas(franjas: FranjaTablet[], horaConsultada: string): FranjaTablet[] {
  const consultada = enMinutos(horaConsultada);
  const distancia = (franja: FranjaTablet) => Math.abs(enMinutos(franja.horaInicio) - consultada);
  return franjas
    .filter((franja) => franja.libres > 0 && franja.horaInicio !== horaConsultada)
    .sort((a, b) => distancia(a) - distancia(b))
    .slice(0, MAXIMO_SUGERIDAS)
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
}

/** Por qué no se puede pedir una tablet ese día, o null si se puede (HU-28). */
export function motivoDiaNoElegible(fecha: string, parametros: Parametros, hoy: string): string | null {
  if (fecha < hoy) return 'Ya pasó';
  const motivo = motivoNoDisponible(fecha, parametros);
  return motivo ? `No disponible: ${motivo}` : null;
}

/** El siguiente día en que se pueden pedir tablets, para sugerirlo cuando el día no tiene (CA2). */
export function siguienteDiaElegible(fecha: string, parametros: Parametros, hoy: string): string | null {
  // Dos semanas alcanzan para saltar un puente festivo.
  let dia = fecha;
  for (let i = 0; i < 14; i++) {
    dia = sumarDias(dia, 1);
    if (motivoDiaNoElegible(dia, parametros, hoy) == null) return dia;
  }
  return null;
}

/** La franja y las condiciones. La fecha la lleva la pantalla, porque con ella pide las franjas. */
export const esquemaPrestamo = z.object({
  horaInicio: z.string().min(1, { error: 'Elige una franja con tablets libres.' }),
  aceptaCondiciones: z.boolean().refine((acepta) => acepta, {
    error: 'Acepta las condiciones de uso para enviar la solicitud.',
  }),
});

export type DatosPrestamo = z.input<typeof esquemaPrestamo>;
