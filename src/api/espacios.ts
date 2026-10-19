/**
 * Espacios de la biblioteca y su disponibilidad (HU-16 y HU-17).
 * Para la comunidad solo se ofrecen los espacios activos.
 * La disponibilidad se calcula con los parámetros de HU-28, las reservas de HU-18/HU-19
 * y los bloqueos de HU-20, sin revelar datos de quien reservó (HU-17, CA3).
 * La ruta de la API es provisional: confirmarla con el equipo de Backend.
 */
import type {
  Bloqueo,
  DiaDisponibilidad,
  Espacio,
  EstadoFranja,
  EstadoSolicitud,
  FranjaDisponibilidad,
  Parametros,
  Reserva,
} from '@/types';
import { esDiaHabil, motivoNoDisponible } from '@/utils/parametros';

import { obtenerBloqueos } from './bloqueos';
import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { ESPACIOS } from './mocks/espacios';
import { obtenerParametros } from './parametros';
import { obtenerSolicitudesReserva } from './reservas';

/** Estados de reserva que ocupan una franja (igual que hayChoque() de HU-19). */
const ESTADOS_QUE_OCUPAN: readonly EstadoSolicitud[] = ['pendiente', 'aprobada', 'nueva_fecha'];

/** Espacios activos para la comunidad (HU-17, CA1). */
export function obtenerEspacios(): Promise<Espacio[]> {
  if (USAR_MOCKS) {
    return simularRed(ESPACIOS.filter((espacio) => espacio.activo).map((e) => ({ ...e })));
  }
  return peticion<Espacio[]>('/espacios/');
}

/** 'HH:MM' → minutos desde las 00:00. */
function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** Minutos desde las 00:00 → 'HH:MM'. */
function aHora(minutos: number): string {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0');
  const m = String(minutos % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/** Fechas 'AAAA-MM-DD' del rango, ambas incluidas. */
function fechasEntre(desde: string, hasta: string): string[] {
  const [a, m, d] = desde.split('-').map(Number);
  const [af, mf, df] = hasta.split('-').map(Number);
  const cursor = new Date(Date.UTC(a, m - 1, d));
  const fin = new Date(Date.UTC(af, mf - 1, df));
  const fechas: string[] = [];
  while (cursor <= fin) {
    fechas.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return fechas;
}

/** ¿Se cruzan las franjas [inicio, fin) y [otroInicio, otroFin)? */
function seCruzan(inicio: number, fin: number, otroInicio: number, otroFin: number): boolean {
  return inicio < otroFin && otroInicio < fin;
}

/**
 * Franjas de 1 hora de un día hábil, con su estado y motivo.
 * Las reservas y los bloqueos deben ser solo los del espacio consultado.
 */
function franjasDelDia(
  fecha: string,
  parametros: Parametros,
  reservas: Reserva[],
  bloqueos: Bloqueo[],
  minimo: Date,
): FranjaDisponibilidad[] {
  const dia = new Date(`${fecha}T00:00:00`).getDay();
  const horario = parametros.horarios.find((h) => h.dia === dia);
  if (!horario) return [];

  const franjas: FranjaDisponibilidad[] = [];
  const abre = aMinutos(horario.abre);
  const cierra = aMinutos(horario.cierra);

  for (let inicio = abre; inicio + 60 <= cierra; inicio += 60) {
    const fin = inicio + 60;

    const bloqueo = bloqueos.find(
      (b) =>
        fecha >= b.desde &&
        fecha <= b.hasta &&
        (!b.horaInicio ||
          !b.horaFin ||
          seCruzan(inicio, fin, aMinutos(b.horaInicio), aMinutos(b.horaFin))),
    );

    const reserva = reservas.find(
      (r) =>
        r.fecha === fecha &&
        ESTADOS_QUE_OCUPAN.includes(r.estado) &&
        seCruzan(inicio, fin, aMinutos(r.horaInicio), aMinutos(r.horaFin)),
    );

    const inicioFechaHora = new Date(`${fecha}T${aHora(inicio)}:00`);
    let estado: EstadoFranja;
    let motivo: string | undefined;

    if (bloqueo) {
      estado = 'bloqueada';
      motivo = bloqueo.motivo;
    } else if (reserva) {
      estado = 'reservada';
    } else if (inicioFechaHora < minimo) {
      estado = 'no_disponible';
      motivo =
        inicioFechaHora < new Date()
          ? 'Ya pasó'
          : `Faltan menos de ${parametros.horasMinimasSolicitud} h para solicitarla`;
    } else {
      estado = 'disponible';
    }

    franjas.push({
      horaInicio: aHora(inicio),
      horaFin: aHora(fin),
      estado,
      ...(motivo ? { motivo } : {}),
    });
  }
  return franjas;
}

/**
 * Disponibilidad de un espacio entre dos fechas, ambas incluidas (HU-17).
 * No incluye datos de quien reservó (CA3).
 */
export async function obtenerDisponibilidad(
  espacioId: string,
  desde: string,
  hasta: string,
): Promise<DiaDisponibilidad[]> {
  if (!USAR_MOCKS) {
    return peticion<DiaDisponibilidad[]>(
      `/espacios/${espacioId}/disponibilidad/?desde=${desde}&hasta=${hasta}`,
    );
  }

  const espacio = ESPACIOS.find((e) => e.id === espacioId && e.activo);
  if (!espacio) {
    throw new ErrorApi(404, 'El espacio no existe o está inactivo.');
  }
  if (desde > hasta) return [];

  const [parametros, todasLasReservas, bloqueos] = await Promise.all([
    obtenerParametros(),
    obtenerSolicitudesReserva('todas'),
    obtenerBloqueos(espacioId),
  ]);
  // La bandeja trae las reservas de todos los espacios: solo cuentan las de este.
  const reservas = todasLasReservas.filter((r) => r.espacioId === espacioId);
  const minimo = new Date(Date.now() + parametros.horasMinimasSolicitud * 60 * 60 * 1000);

  return fechasEntre(desde, hasta).map((fecha) => {
    if (!esDiaHabil(fecha, parametros)) {
      return {
        fecha,
        habil: false,
        motivo: motivoNoDisponible(fecha, parametros) ?? undefined,
        franjas: [],
      };
    }
    return {
      fecha,
      habil: true,
      franjas: franjasDelDia(fecha, parametros, reservas, bloqueos, minimo),
    };
  });
}
