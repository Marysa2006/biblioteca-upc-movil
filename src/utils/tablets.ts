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
import { sumarDias } from '@/utils/calendario';
import { aHora, aMinutos } from '@/utils/franjas';
import { motivoNoDisponible } from '@/utils/parametros';
import { camposSolicitante, reglasSolicitante } from '@/utils/solicitante';

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

// ── #310: la tablet se asigna al entregarla ────────────────────
//
// La bibliotecóloga decidió que la persona aparta una tablet desde la app y que la tablet
// específica se asigna al llegar, por su código (decisión 8). Para no cambiar el contrato, el
// préstamo sigue guardando una tablet al pedirlo, pero es provisional: solo reserva el cupo, no se
// muestra, y al entregar el personal elige o escanea la que entrega.

/** Cuánto se espera a que la persona recoja la tablet: después, el préstamo se libera (#310). */
export const MINUTOS_PARA_RECOGER = 60;

/**
 * ¿El préstamo apartado ya no se recogió? Pasaron MINUTOS_PARA_RECOGER desde su hora de inicio
 * sin entregarlo. Como el Backend, que libera la tablet a la hora (#310).
 */
export function noSeRecogio(
  prestamo: Prestamo,
  ahora: Date = new Date(),
  minutos: number = MINUTOS_PARA_RECOGER,
): boolean {
  if (prestamo.estado !== 'reservado') return false;
  const inicio = new Date(`${prestamo.fecha}T${prestamo.horaInicio}:00`);
  return ahora.getTime() >= inicio.getTime() + minutos * 60000;
}

/** Lo que pasa al entregar una tablet: cuál se entrega y si hay que cambiar la de otro préstamo. */
export type AsignacionEntrega =
  | {
      tablet: Tablet;
      /** Otro préstamo apartado que tenía esta tablet: se queda con la provisional de este. */
      intercambio?: { prestamoId: string; tabletId: string };
    }
  | { problema: string };

/**
 * ¿Se puede entregar esta tablet en este préstamo? (#310). Tiene que estar disponible ahora y
 * libre toda la franja del préstamo. Si otro préstamo **apartado** la tenía provisionalmente en
 * esas horas, se le pasa la tablet provisional de este, siempre que le sirva toda su franja; si no,
 * no se puede.
 */
export function asignarTabletAlEntregar(
  tablets: Tablet[],
  prestamos: Prestamo[],
  prestamo: Prestamo,
  tabletId: string,
): AsignacionEntrega {
  const tablet = tablets.find((actual) => actual.id === tabletId);
  if (!tablet) return { problema: 'La tablet no existe.' };
  if (tablet.estado !== 'disponible') {
    return { problema: `La tablet ${tablet.codigo} no está disponible para entregar.` };
  }
  const choques = prestamos.filter(
    (otro) =>
      otro.id !== prestamo.id &&
      otro.tabletId === tablet.id &&
      prestamoOcupaFranja(otro, prestamo.fecha, prestamo.horaInicio, prestamo.horaLimite),
  );
  if (choques.length === 0) return { tablet };

  const [otro] = choques;
  const provisional = tablets.find((actual) => actual.id === prestamo.tabletId);
  const provisionalLeSirve =
    choques.length === 1 &&
    otro.estado === 'reservado' &&
    provisional != null &&
    provisional.id !== tablet.id &&
    estaOperativa(provisional) &&
    !prestamos.some(
      (cualquiera) =>
        cualquiera.id !== prestamo.id &&
        cualquiera.id !== otro.id &&
        cualquiera.tabletId === provisional.id &&
        prestamoOcupaFranja(cualquiera, otro.fecha, otro.horaInicio, otro.horaLimite),
    );
  if (provisionalLeSirve) {
    return { tablet, intercambio: { prestamoId: otro.id, tabletId: provisional.id } };
  }
  return {
    problema: `La tablet ${tablet.codigo} está ocupada en esas horas por otro préstamo. Elige otra.`,
  };
}

/** Las tablets que se pueden entregar en este préstamo, por código (#310). */
export function tabletsParaEntregar(
  tablets: Tablet[],
  prestamos: Prestamo[],
  prestamo: Prestamo,
): Tablet[] {
  return tablets
    .filter(
      (tablet) => 'tablet' in asignarTabletAlEntregar(tablets, prestamos, prestamo, tablet.id),
    )
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
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

/**
 * El último día en que se puede apartar una tablet: hoy más `diasMaximosTablet` (#278, 7 en el
 * Backend). La API y el calendario usan el mismo límite.
 */
export function ultimoDiaTablet(parametros: Parametros, hoy: string): string {
  return sumarDias(hoy, parametros.diasMaximosTablet);
}

/** Lo que se dice cuando el día pasa de `diasMaximosTablet`. */
export function mensajeDiasMaximosTablet(parametros: Parametros): string {
  return `Las tablets se apartan con hasta ${parametros.diasMaximosTablet} días de anticipación.`;
}

/** Por qué no se puede pedir una tablet ese día, o null si se puede (HU-28 y #278). */
export function motivoDiaNoElegible(fecha: string, parametros: Parametros, hoy: string): string | null {
  if (fecha < hoy) return 'Ya pasó';
  if (fecha > ultimoDiaTablet(parametros, hoy)) {
    return `Solo hasta ${parametros.diasMaximosTablet} días antes`;
  }
  const motivo = motivoNoDisponible(fecha, parametros);
  return motivo ? `No disponible: ${motivo}` : null;
}

// ── Préstamo por horas, datos y responsabilidad (versión 1.1, #163) ─────────────────────
// Las reglas son las mismas en el formulario y en la API (solicitarPrestamo): viven aquí.

/**
 * El préstamo empieza en punto o y media (#163): las franjas del día salen cada 30 minutos y
 * cada una dura 1 hora. No es un parámetro de la biblioteca.
 */
export const MINUTOS_ENTRE_INICIOS_TABLET = 30;

/** ¿La hora de inicio cae en punto o y media? */
export function esInicioTablet(horaInicio: string): boolean {
  return aMinutos(horaInicio) % MINUTOS_ENTRE_INICIOS_TABLET === 0;
}

/** "10:30" y 3 horas → "13:30": la hora límite de devolución. */
export function horaLimiteDe(horaInicio: string, horas: number): string {
  return aHora(aMinutos(horaInicio) + horas * 60);
}

/**
 * Las horas que quedan elegidas al empezar: `horasPrestamoTablet` (#278, 3 en el Backend), sin
 * pasar del máximo.
 */
export function horasPorDefecto(parametros: Parametros): number {
  return Math.max(1, Math.min(parametros.horasPrestamoTablet, parametros.horasMaximasPrestamo));
}

/** Las horas del préstamo son un entero de 1 al máximo de los parámetros (CA4). */
export function problemaHoras(horas: number, maximo: number): string | null {
  if (!Number.isInteger(horas) || horas < 1 || horas > maximo) {
    return `Elige de 1 a ${maximo} ${maximo === 1 ? 'hora' : 'horas'}.`;
  }
  return null;
}

/**
 * Cuántas horas completas se pueden pedir desde una franja: hasta el máximo de los parámetros y
 * sin pasar del cierre, que es el fin de la última franja del día. Sin la franja, 0.
 */
export function horasPosibles(
  franjas: FranjaTablets[],
  horaInicio: string,
  maximo: number,
): number {
  const ultima = franjas[franjas.length - 1];
  if (!ultima || !franjas.some((franja) => franja.horaInicio === horaInicio)) return 0;
  const hastaElCierre = Math.floor((aMinutos(ultima.horaFin) - aMinutos(horaInicio)) / 60);
  return Math.max(0, Math.min(maximo, hastaElCierre));
}

/**
 * La solicitud: la franja de inicio, las horas, los datos de quien la pide con las reglas de
 * #224 (utils/solicitante: la identificación y, para estudiantes, la sede, #294), las condiciones
 * (CA3) y la responsabilidad (#163). La fecha la lleva la pantalla, porque con ella pide las franjas.
 * Cada campo se valida por su lado para que los errores se vean todos a la vez; las reglas
 * entre campos del solicitante van en superRefine.
 */
export function esquemaPrestamo({ maximoHoras }: { maximoHoras: number }) {
  return z
    .object({
      ...camposSolicitante,
      horaInicio: z.string().min(1, { error: 'Elige una franja con tablets libres.' }),
      /** Del CampoNumerico, como texto. */
      horas: z
        .string()
        .refine((valor) => valor !== '' && !problemaHoras(Number(valor), maximoHoras), {
          error: problemaHoras(0, maximoHoras) ?? '',
        }),
      aceptaCondiciones: z.boolean().refine((acepta) => acepta, {
        error: 'Acepta las condiciones de uso para enviar la solicitud.',
      }),
      responsabilidadAceptada: z.boolean().refine((acepta) => acepta, {
        error: 'Acepta la responsabilidad sobre el préstamo para enviar la solicitud.',
      }),
    })
    .superRefine((datos, ctx) =>
      reglasSolicitante(datos, ctx, { pedirIdentificacion: true, pedirSede: true }),
    );
}

export type DatosPrestamo = z.input<ReturnType<typeof esquemaPrestamo>>;
