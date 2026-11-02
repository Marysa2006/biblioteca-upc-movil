/**
 * Reglas de la agenda del facilitador (HU-15). Funciones puras, sin hooks.
 * - La agenda muestra las citas que se atienden: pendientes, aprobadas y realizadas (CA1).
 * - El resultado o la inasistencia se registran cuando la cita aprobada ya terminó (CA3).
 */
import { z } from 'zod';

import type { Cita, EstadoSolicitud, HorarioAtencion } from '@/types';
import { diasSemana, mismoMes, numeroDia, sumarDias } from '@/utils/calendario';
import { fechaLegible } from '@/utils/fechas';
import { inicioReserva } from '@/utils/recordatorios';

/** Estados que aparecen en la agenda; las rechazadas y canceladas no se atienden. */
export const ESTADOS_AGENDA: EstadoSolicitud[] = ['pendiente', 'aprobada', 'realizada'];

const porFechaYHora = (a: Cita, b: Cita) =>
  a.fecha === b.fecha ? a.horaInicio.localeCompare(b.horaInicio) : a.fecha.localeCompare(b.fecha);

/** Las citas de la agenda, de la más próxima a la más lejana. */
export function citasAsignadas(citas: Cita[]): Cita[] {
  return citas.filter((cita) => ESTADOS_AGENDA.includes(cita.estado)).sort(porFechaYHora);
}

/** Las citas de un día, ordenadas por hora (vista del día). */
export function citasDelDia(citas: Cita[], fecha: string): Cita[] {
  return citasAsignadas(citas).filter((cita) => cita.fecha === fecha);
}

export type DiaCitas = { fecha: string; citas: Cita[] };

/** Las citas agrupadas por día, en orden (vista de la semana). Los días sin citas no aparecen. */
export function agruparCitasPorDia(citas: Cita[]): DiaCitas[] {
  const dias: DiaCitas[] = [];
  for (const cita of citasAsignadas(citas)) {
    const ultimo = dias[dias.length - 1];
    if (ultimo && ultimo.fecha === cita.fecha) ultimo.citas.push(cita);
    else dias.push({ fecha: cita.fecha, citas: [cita] });
  }
  return dias;
}

/** Los días que muestra la agenda en Día y Semana: de lunes a sábado (los domingos no hay citas). */
export function diasAgenda(fecha: string): string[] {
  return diasSemana(fecha).slice(0, 6);
}

/** El domingo pasa al lunes siguiente, para que la vista Día no quede en un domingo. */
export function diaDeAgenda(fecha: string): string {
  return diasSemana(fecha)[6] === fecha ? sumarDias(fecha, 1) : fecha;
}

/** Un día antes o después en la vista Día, saltando el domingo. */
export function moverDiaAgenda(fecha: string, paso: 1 | -1): string {
  const siguiente = sumarDias(fecha, paso);
  return diasSemana(siguiente)[6] === siguiente ? sumarDias(siguiente, paso) : siguiente;
}

/** "26 al 31 de octubre", o "28 de septiembre al 3 de octubre" si cruza de mes (sin el domingo). */
export function tituloSemanaAgenda(fecha: string): string {
  const dias = diasAgenda(fecha);
  const desde = dias[0];
  const hasta = dias[dias.length - 1];
  if (mismoMes(desde, hasta)) return `${numeroDia(desde)} al ${fechaLegible(hasta)}`;
  return `${fechaLegible(desde)} al ${fechaLegible(hasta)}`;
}

/** Ícono de cada estado de la agenda: las convenciones, el mes y la tira de días usan los mismos. */
export const ICONO_ESTADO_AGENDA: Partial<Record<EstadoSolicitud, string>> = {
  pendiente: 'clock-outline',
  aprobada: 'check',
  realizada: 'check-all',
};

/** Nombre de cada estado en singular y plural, para el lector de pantalla ("2 aprobadas"). */
const NOMBRE_ESTADO_AGENDA: Partial<Record<EstadoSolicitud, [string, string]>> = {
  pendiente: ['pendiente', 'pendientes'],
  aprobada: ['aprobada', 'aprobadas'],
  realizada: ['realizada', 'realizadas'],
};

/** "aprobada" o "aprobadas", según la cantidad. */
export function nombreEstadoAgenda(estado: EstadoSolicitud, cantidad: number): string {
  const [singular, plural] = NOMBRE_ESTADO_AGENDA[estado] ?? [estado, estado];
  return cantidad === 1 ? singular : plural;
}

/** Con el filtro de las convenciones, solo las citas de ese estado; sin filtro, todas. */
export function filtrarPorEstado(citas: Cita[], estado: EstadoSolicitud | null): Cita[] {
  return estado ? citas.filter((cita) => cita.estado === estado) : citas;
}

/** Las citas de un día: el total y cuántas hay de cada estado, en el orden de ESTADOS_AGENDA. */
export type ConteoDia = {
  total: number;
  estados: { estado: EstadoSolicitud; cantidad: number }[];
};

/** Cuántas citas de cada estado tiene cada día, para la tira de días y el mes. */
export function contarCitasPorDia(citas: Cita[]): Map<string, ConteoDia> {
  const porDia = new Map<string, Map<EstadoSolicitud, number>>();
  for (const cita of citasAsignadas(citas)) {
    const delDia = porDia.get(cita.fecha) ?? new Map<EstadoSolicitud, number>();
    delDia.set(cita.estado, (delDia.get(cita.estado) ?? 0) + 1);
    porDia.set(cita.fecha, delDia);
  }

  const conteo = new Map<string, ConteoDia>();
  for (const [fecha, delDia] of porDia) {
    const estados = ESTADOS_AGENDA.filter((estado) => delDia.has(estado)).map((estado) => ({
      estado,
      cantidad: delDia.get(estado) ?? 0,
    }));
    conteo.set(fecha, { total: estados.reduce((suma, e) => suma + e.cantidad, 0), estados });
  }
  return conteo;
}

/** "1 cita" o "3 citas". */
export const textoCitas = (cantidad: number) => (cantidad === 1 ? '1 cita' : `${cantidad} citas`);

/** "Sin citas", "1 cita aprobada" o "3 citas: 1 pendiente y 2 aprobadas" (lector de pantalla). */
export function textoConteoDia(conteo: ConteoDia | undefined): string {
  if (!conteo || conteo.total === 0) return 'Sin citas';
  if (conteo.estados.length === 1) {
    const { estado, cantidad } = conteo.estados[0];
    return `${textoCitas(cantidad)} ${nombreEstadoAgenda(estado, cantidad)}`;
  }
  const partes = conteo.estados.map(
    ({ estado, cantidad }) => `${cantidad} ${nombreEstadoAgenda(estado, cantidad)}`,
  );
  const ultima = partes.pop();
  return `${textoCitas(conteo.total)}: ${partes.join(', ')} y ${ultima}`;
}

/** Ya pasó la hora de fin de la cita, en la hora del celular. */
export function citaTerminada(cita: Cita, ahora = new Date()): boolean {
  return inicioReserva({ fecha: cita.fecha, horaInicio: cita.horaFin }) <= ahora;
}

/** Ya se registró el resultado o la inasistencia. */
export const citaAtendida = (cita: Cita) => cita.resultado != null || cita.asistio === false;

/** CA3: la cita aprobada que ya terminó y todavía no tiene resultado ni inasistencia. */
export function puedeRegistrarResultado(cita: Cita, ahora = new Date()): boolean {
  return cita.estado === 'aprobada' && citaTerminada(cita, ahora) && !citaAtendida(cita);
}

const LARGO_MINIMO_RESULTADO = 10;
const LARGO_MAXIMO_RESULTADO = 500;

/** CA3: el resultado o la nota de la asesoría. */
export const esquemaResultado = z.object({
  resultado: z
    .string()
    .trim()
    .min(LARGO_MINIMO_RESULTADO, {
      error: `Cuenta en al menos ${LARGO_MINIMO_RESULTADO} caracteres cómo fue la asesoría.`,
    })
    .max(LARGO_MAXIMO_RESULTADO, { error: `Máximo ${LARGO_MAXIMO_RESULTADO} caracteres.` }),
});

/** Se llama Datos y no Formulario: FormularioResultado es el componente. */
export type DatosResultado = z.input<typeof esquemaResultado>;

/** 'HH:MM' → minutos desde la medianoche. */
export function aMinutos(hora: string): number {
  const [horas, minutos] = hora.split(':').map(Number);
  return horas * 60 + minutos;
}

/** Las horas que muestra la malla de la semana, en minutos y en horas enteras. */
export type RangoMalla = { inicio: number; fin: number };

/** Sin horarios de atención, la malla va de 7:00 a 19:00. */
const RANGO_MALLA_PREDETERMINADO: RangoMalla = { inicio: 7 * 60, fin: 19 * 60 };

/**
 * De la primera apertura a la última hora de cierre de los parámetros (HU-28), en horas
 * enteras. Si alguna cita queda por fuera, el rango crece para que se vea.
 */
export function rangoHorasMalla(
  horarios: HorarioAtencion[] | undefined,
  citas: Cita[],
): RangoMalla {
  const inicios = [
    ...(horarios ?? []).map((h) => aMinutos(h.abre)),
    ...citas.map((c) => aMinutos(c.horaInicio)),
  ];
  const fines = [
    ...(horarios ?? []).map((h) => aMinutos(h.cierra)),
    ...citas.map((c) => aMinutos(c.horaFin)),
  ];
  if (inicios.length === 0) return RANGO_MALLA_PREDETERMINADO;
  return {
    inicio: Math.floor(Math.min(...inicios) / 60) * 60,
    fin: Math.ceil(Math.max(...fines) / 60) * 60,
  };
}

/** Una cita en la malla: su columna y cuántas columnas comparten ese momento del día. */
export type CitaEnMalla = { cita: Cita; columna: number; columnas: number };

/**
 * Reparte las citas de un día en columnas paralelas para que las simultáneas no se tapen.
 * Las que se cruzan forman un grupo; cada una toma la primera columna libre del grupo, y
 * todas las del grupo se dividen el ancho en partes iguales.
 */
export function distribuirCitas(citas: Cita[]): CitaEnMalla[] {
  const ordenadas = [...citas].sort(
    (a, b) =>
      aMinutos(a.horaInicio) - aMinutos(b.horaInicio) || aMinutos(b.horaFin) - aMinutos(a.horaFin),
  );
  const resultado: CitaEnMalla[] = [];
  let grupo: CitaEnMalla[] = [];
  // Hora en que termina cada columna del grupo actual, y el fin más tardío del grupo.
  let finColumnas: number[] = [];
  let finGrupo = -1;

  const cerrarGrupo = () => {
    for (const item of grupo) item.columnas = finColumnas.length;
    resultado.push(...grupo);
    grupo = [];
    finColumnas = [];
  };

  for (const cita of ordenadas) {
    const inicio = aMinutos(cita.horaInicio);
    const fin = aMinutos(cita.horaFin);
    if (inicio >= finGrupo) cerrarGrupo();
    let columna = finColumnas.findIndex((finColumna) => finColumna <= inicio);
    if (columna === -1) columna = finColumnas.length;
    finColumnas[columna] = fin;
    finGrupo = Math.max(finGrupo, fin);
    grupo.push({ cita, columna, columnas: 1 });
  }
  cerrarGrupo();
  return resultado;
}
