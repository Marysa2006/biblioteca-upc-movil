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
  Usuario,
} from '@/types';
import { esFechaValida, esHoraValida } from '@/utils/fechas';
import { esDiaHabil, motivoNoDisponible } from '@/utils/parametros';

import { obtenerBloqueos } from './bloqueos';
import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { ESPACIOS } from './mocks/espacios';
import { obtenerParametros } from './parametros';
import {
  obtenerSolicitudesReserva,
  registrarSolicitudReserva,
  type DatosSolicitudReserva,
} from './reservas';

export type { DatosSolicitudReserva } from './reservas';

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

// ── Solicitud de reserva (HU-18) ───────────────────────────────────────────────

/**
 * Lo que llena el usuario en el formulario de reserva (HU-18).
 * Quién solicita sale de la sesión, no del formulario.
 */
export type FormularioReserva = Omit<DatosSolicitudReserva, 'solicitanteId' | 'solicitante'>;

/** Horario alternativo sugerido cuando el pedido no está disponible (CA2). */
export type AlternativaReserva = {
  fecha: string;
  horaInicio: string;
  horaFin: string;
};

/** Error 400 de la solicitud, con horarios alternativos (CA2). */
export class ErrorReserva extends ErrorApi {
  alternativas: AlternativaReserva[];

  constructor(mensaje: string, alternativas: AlternativaReserva[] = []) {
    super(400, mensaje);
    this.name = 'ErrorReserva';
    this.alternativas = alternativas;
  }
}

/** Suma días a una fecha 'AAAA-MM-DD'. */
function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number);
  const resultado = new Date(Date.UTC(a, m - 1, d));
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado.toISOString().slice(0, 10);
}

function duracionHoras(inicio: string, fin: string): number {
  return (aMinutos(fin) - aMinutos(inicio)) / 60;
}

/**
 * La ventana libre de la duración pedida más cercana a la hora pedida en un día, o ninguna.
 * Así, a quien pidió 11:00 se le sugiere 13:00 antes que 07:00.
 */
function alternativaEnDia(
  dia: DiaDisponibilidad,
  duracion: number,
  horaPedida: string,
): AlternativaReserva | null {
  let mejor: AlternativaReserva | null = null;
  let menorDistancia = Infinity;
  for (let i = 0; i + duracion <= dia.franjas.length; i += 1) {
    const ventana = dia.franjas.slice(i, i + duracion);
    if (!ventana.every((franja) => franja.estado === 'disponible')) continue;
    const distancia = Math.abs(aMinutos(ventana[0].horaInicio) - aMinutos(horaPedida));
    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      mejor = {
        fecha: dia.fecha,
        horaInicio: ventana[0].horaInicio,
        horaFin: ventana[ventana.length - 1].horaFin,
      };
    }
  }
  return mejor;
}

/** Hasta 3 alternativas, una por día, en la semana que empieza en la fecha pedida (CA2). */
async function buscarAlternativas(
  datos: FormularioReserva,
  duracion: number,
): Promise<AlternativaReserva[]> {
  const dias = await obtenerDisponibilidad(datos.espacioId, datos.fecha, sumarDias(datos.fecha, 7));
  const alternativas: AlternativaReserva[] = [];
  for (const dia of dias) {
    const alternativa = alternativaEnDia(dia, duracion, datos.horaInicio);
    if (alternativa) alternativas.push(alternativa);
    if (alternativas.length === 3) break;
  }
  return alternativas;
}

/**
 * Solicita una reserva a nombre del usuario de la sesión (HU-18); queda pendiente.
 * Valida formato, capacidad (CA3), día hábil, anticipación y disponibilidad con la misma
 * regla de HU-17. Si el horario no está libre, lanza ErrorReserva con alternativas (CA2).
 */
export async function solicitarReserva(
  usuario: Usuario,
  datos: FormularioReserva,
): Promise<Reserva> {
  if (!USAR_MOCKS) {
    // Ruta provisional: confirmar con Backend. El solicitante sale del token.
    return peticion<Reserva>('/reservas/', { method: 'POST', body: JSON.stringify(datos) });
  }

  if (
    !esFechaValida(datos.fecha) ||
    !esHoraValida(datos.horaInicio) ||
    !esHoraValida(datos.horaFin)
  ) {
    throw new ErrorApi(400, 'Revisa la fecha y las horas de la reserva.');
  }

  const espacio = ESPACIOS.find((e) => e.id === datos.espacioId && e.activo);
  if (!espacio) {
    throw new ErrorApi(404, 'El espacio no existe o está inactivo.');
  }
  if (!datos.proposito?.trim()) {
    throw new ErrorApi(400, 'El propósito de la reserva es obligatorio.');
  }
  if (
    !Number.isInteger(datos.asistentes) ||
    datos.asistentes < 1 ||
    datos.asistentes > espacio.capacidad
  ) {
    throw new ErrorApi(400, `Este espacio admite entre 1 y ${espacio.capacidad} asistentes.`);
  }

  const parametros = await obtenerParametros();
  if (!esDiaHabil(datos.fecha, parametros)) {
    throw new ErrorApi(400, 'La fecha no es un día hábil de la biblioteca.');
  }

  if (datos.horaFin <= datos.horaInicio) {
    throw new ErrorApi(400, 'La hora de fin debe ser posterior a la de inicio.');
  }
  const duracion = duracionHoras(datos.horaInicio, datos.horaFin);
  if (!Number.isInteger(duracion)) {
    throw new ErrorApi(400, 'El horario debe ser de horas completas.');
  }

  const dias = await obtenerDisponibilidad(datos.espacioId, datos.fecha, datos.fecha);
  const franjas = dias[0]?.franjas ?? [];
  const pedidas = franjas.filter(
    (franja) => franja.horaInicio >= datos.horaInicio && franja.horaFin <= datos.horaFin,
  );
  const disponible =
    pedidas.length === duracion && pedidas.every((franja) => franja.estado === 'disponible');

  if (!disponible) {
    const alternativas = await buscarAlternativas(datos, duracion);
    throw new ErrorReserva('Ese horario no está disponible.', alternativas);
  }

  return simularRed(
    registrarSolicitudReserva({
      espacioId: datos.espacioId,
      solicitanteId: usuario.id,
      solicitante: usuario.nombre,
      fecha: datos.fecha,
      horaInicio: datos.horaInicio,
      horaFin: datos.horaFin,
      proposito: datos.proposito.trim(),
      asistentes: datos.asistentes,
      requerimientos: datos.requerimientos?.trim() || undefined,
    }),
  );
}
