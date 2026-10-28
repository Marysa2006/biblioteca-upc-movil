/**
 * Reglas del inventario de tablets (HU-21, CA3), de la disponibilidad por franja (HU-22),
 * de la entrega/devolución (HU-23) y de la solicitud de préstamo en la UI (HU-22).
 * Funciones puras, sin hooks.
 */
import { z } from 'zod';

import type { AlternativaPrestamo, FranjaTablets } from '@/hooks/useTablets';
import type {
  CondicionTablet,
  EstadoPrestamo,
  EstadoTablet,
  Parametros,
  Prestamo,
  Tablet,
} from '@/types';
import { motivoNoDisponible } from '@/utils/parametros';

/** Una tablet está operativa si no está en mantenimiento ni de baja. */
export function estaOperativa(tablet: Tablet): boolean {
  return tablet.estado !== 'mantenimiento' && tablet.estado !== 'de_baja';
}

/** Tablets que se pueden prestar: operativas y libres (HU-21, CA3). */
export function tabletsDisponibles(tablets: Tablet[]): Tablet[] {
  return tablets.filter((tablet) => tablet.estado === 'disponible');
}

/** Estados de préstamo que ocupan la tablet en su franja; devuelto y cancelado la liberan. */
export const ESTADOS_PRESTAMO_OCUPAN: readonly EstadoPrestamo[] = [
  'reservado',
  'entregado',
  'vencido',
];

/**
 * ¿El préstamo ocupa su tablet en la franja? Mismo día y horas que se cruzan (HU-22).
 * Las horas 'HH:MM' se comparan como texto porque tienen ancho fijo.
 */
export function prestamoOcupaFranja(
  prestamo: Prestamo,
  fecha: string,
  horaInicio: string,
  horaLimite: string,
): boolean {
  return (
    ESTADOS_PRESTAMO_OCUPAN.includes(prestamo.estado) &&
    prestamo.fecha === fecha &&
    prestamo.horaInicio < horaLimite &&
    horaInicio < prestamo.horaLimite
  );
}

/**
 * Tablets operativas sin ningún préstamo que ocupe la franja (HU-22). No mira el estado
 * actual 'en_prestamo': una tablet prestada hoy puede estar libre otro día.
 */
export function tabletsLibresEnFranja(
  tablets: Tablet[],
  prestamos: Prestamo[],
  fecha: string,
  horaInicio: string,
  horaLimite: string,
): Tablet[] {
  return tablets.filter(
    (tablet) =>
      estaOperativa(tablet) &&
      !prestamos.some(
        (prestamo) =>
          prestamo.tabletId === tablet.id &&
          prestamoOcupaFranja(prestamo, fecha, horaInicio, horaLimite),
      ),
  );
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

// ── Solicitud de préstamo en la UI (HU-22) ────────────────────────────────────────────
// Qué franjas están disponibles lo deciden los datos (useDisponibilidadTablets): aquí solo
// se elige cuáles mostrar. Sin tablets en una franja, se sugieren las más cercanas del día
// (CA2); si el día no tiene ninguna, las sugerencias del día que manda la API.
// Sin aceptar las condiciones de uso, la solicitud no se envía (CA3); la API vuelve a validar.

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

/**
 * CA2: hasta 3 franjas disponibles del mismo día, las más cercanas a la consultada, en orden
 * de hora. Con franjas de 1 hora, la hora límite es el fin de la franja.
 */
export function franjasSugeridas(
  franjas: FranjaTablets[],
  horaConsultada: string,
  fecha: string,
): AlternativaPrestamo[] {
  const consultada = enMinutos(horaConsultada);
  const distancia = (franja: FranjaTablets) => Math.abs(enMinutos(franja.horaInicio) - consultada);
  return franjas
    .filter((franja) => franja.estado === 'disponible' && franja.horaInicio !== horaConsultada)
    .sort((a, b) => distancia(a) - distancia(b))
    .slice(0, MAXIMO_SUGERIDAS)
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
    .map((franja) => ({ fecha, horaInicio: franja.horaInicio, horaLimite: franja.horaFin }));
}

/** Por qué no se puede pedir una tablet ese día, o null si se puede (HU-28). */
export function motivoDiaNoElegible(fecha: string, parametros: Parametros, hoy: string): string | null {
  if (fecha < hoy) return 'Ya pasó';
  const motivo = motivoNoDisponible(fecha, parametros);
  return motivo ? `No disponible: ${motivo}` : null;
}

/** La franja y las condiciones. La fecha la lleva la pantalla, porque con ella pide las franjas. */
export const esquemaPrestamo = z.object({
  horaInicio: z.string().min(1, { error: 'Elige una franja con tablets libres.' }),
  aceptaCondiciones: z.boolean().refine((acepta) => acepta, {
    error: 'Acepta las condiciones de uso para enviar la solicitud.',
  }),
});

export type DatosPrestamo = z.input<typeof esquemaPrestamo>;
