/**
 * El Dashboard del personal (#306): las cifras del día, lo pendiente y la afluencia semanal.
 * Funciones puras, sin hooks: reciben las listas que ya traen los hooks de cada servicio (solo
 * las de los permisos de la persona; las demás llegan como undefined) y devuelven lo que muestra
 * la pantalla. Así se prueban sin abrir la app.
 */
import type { Cita, Prestamo, RegistroUso, Reserva, SolicitudCapacitacion } from '@/types';
import type { ValorSeccionGestion } from '@/utils/gestion';

/** Las listas que el Dashboard puede tener, según los permisos; undefined = no se pide. */
export type DatosPanel = {
  reservas?: Reserva[];
  citas?: Cita[];
  capacitaciones?: SolicitudCapacitacion[];
  prestamos?: Prestamo[];
};

/** Las tres cifras del encabezado. */
export type CifrasDelDia = {
  /** Solicitudes que esperan la respuesta del personal. */
  porRevisar: number;
  /** Lo aprobado para hoy: reservas, citas y capacitaciones. */
  paraHoy: number;
  /** Tablets entregadas que no se han devuelto (también las vencidas); null sin el permiso. */
  tabletsPrestadas: number | null;
};

/** Las solicitudes de las tres listas, con su fecha, para contarlas igual. */
function solicitudes({ reservas = [], citas = [], capacitaciones = [] }: DatosPanel) {
  return [...reservas, ...citas, ...capacitaciones];
}

/** Por revisar, para hoy y tablets prestadas, con las listas que tenga la persona. */
export function cifrasDelDia(datos: DatosPanel, hoy: string): CifrasDelDia {
  const todas = solicitudes(datos);
  return {
    porRevisar: todas.filter((solicitud) => solicitud.estado === 'pendiente').length,
    paraHoy: todas.filter((solicitud) => solicitud.estado === 'aprobada' && solicitud.fecha === hoy)
      .length,
    tabletsPrestadas: datos.prestamos
      ? datos.prestamos.filter(
          (prestamo) => prestamo.estado === 'entregado' || prestamo.estado === 'vencido',
        ).length
      : null,
  };
}

/** De qué servicio es una solicitud pendiente. */
export type TipoPendiente = 'reserva' | 'asesoria' | 'capacitacion';

export const NOMBRE_TIPO_PENDIENTE: Record<TipoPendiente, string> = {
  reserva: 'Reserva',
  asesoria: 'Asesoría',
  capacitacion: 'Capacitación',
};

/** Una solicitud pendiente para la Actividad reciente. */
export type Pendiente = {
  id: string;
  tipo: TipoPendiente;
  /** Qué se pide: el propósito de la reserva, el tema de la asesoría o la línea. */
  titulo: string;
  /** Quién lo pide. */
  persona: string;
  /** 'AAAA-MM-DD' y 'HH:MM' del servicio. */
  fecha: string;
  hora: string;
};

/**
 * Lo que espera la respuesta del personal, de las listas que tenga la persona, por la fecha del
 * servicio: la más próxima primero, que es lo que hay que atender antes. Las solicitudes no
 * guardan cuándo se crearon, así que no se ordena por «más reciente».
 */
export function pendientesPorAtender(
  { reservas = [], citas = [], capacitaciones = [] }: DatosPanel,
  nombreEspacio: (espacioId: string) => string | undefined = () => undefined,
): Pendiente[] {
  const lista: Pendiente[] = [
    ...reservas
      .filter((reserva) => reserva.estado === 'pendiente')
      .map((reserva) => {
        const espacio = nombreEspacio(reserva.espacioId);
        return {
          id: reserva.id,
          tipo: 'reserva' as const,
          titulo: espacio ? `${espacio}: ${reserva.proposito}` : reserva.proposito,
          persona: reserva.solicitante,
          fecha: reserva.fecha,
          hora: reserva.horaInicio,
        };
      }),
    ...citas
      .filter((cita) => cita.estado === 'pendiente')
      .map((cita) => ({
        id: cita.id,
        tipo: 'asesoria' as const,
        titulo: cita.tema,
        persona: cita.solicitante,
        fecha: cita.fecha,
        hora: cita.horaInicio,
      })),
    ...capacitaciones
      .filter((solicitud) => solicitud.estado === 'pendiente')
      .map((solicitud) => ({
        id: solicitud.id,
        tipo: 'capacitacion' as const,
        titulo: solicitud.linea,
        persona: solicitud.solicitante.nombre,
        fecha: solicitud.fecha,
        hora: solicitud.hora,
      })),
  ];
  return lista.sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
}

/** Un día de la Afluencia semanal. */
export type DiaAfluencia = {
  /** 'L', 'M', 'X', 'J', 'V' o 'S', para debajo de la columna. */
  corto: string;
  /** 'lunes'…'sábado', para el lector de pantalla. */
  nombre: string;
  /** Operaciones en esos días del periodo. */
  total: number;
  /** Promedio por semana, con un decimal. */
  promedio: number;
};

export type Afluencia = {
  dias: DiaAfluencia[];
  /** El día con más operaciones; null si no hubo ninguna. */
  pico: string | null;
  semanas: number;
};

/** De lunes a sábado: la semana de la biblioteca (el domingo no abre). */
const DIAS: { corto: string; nombre: string }[] = [
  { corto: 'L', nombre: 'lunes' },
  { corto: 'M', nombre: 'martes' },
  { corto: 'X', nombre: 'miércoles' },
  { corto: 'J', nombre: 'jueves' },
  { corto: 'V', nombre: 'viernes' },
  { corto: 'S', nombre: 'sábado' },
];

/** Cuántas semanas atrás mira la Afluencia semanal. */
export const SEMANAS_AFLUENCIA = 8;

/** 'AAAA-MM-DD' de hace n días. */
function haceDias(hoy: string, dias: number): string {
  const [anio, mes, dia] = hoy.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia - dias);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

/** Día de la semana de 'AAAA-MM-DD': 0 domingo … 6 sábado. */
function diaDeLaSemana(fecha: string): number {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(anio, mes - 1, dia).getDay();
}

/**
 * Operaciones por día de la semana (lunes a sábado) de las últimas `semanas` semanas, contando
 * hoy, con el promedio por semana y el día de más uso. Como «Afluencia semanal» del mockup, pero
 * con lo que la app registra: no hay aforo en tiempo real.
 */
export function afluenciaSemanal(
  registros: RegistroUso[],
  hoy: string,
  semanas = SEMANAS_AFLUENCIA,
): Afluencia {
  const desde = haceDias(hoy, semanas * 7 - 1);
  const totales = [0, 0, 0, 0, 0, 0];
  for (const registro of registros) {
    if (registro.fecha < desde || registro.fecha > hoy) continue;
    const dia = diaDeLaSemana(registro.fecha);
    if (dia >= 1 && dia <= 6) totales[dia - 1] += 1;
  }
  const maximo = Math.max(...totales);
  return {
    dias: DIAS.map((dia, indice) => ({
      ...dia,
      total: totales[indice],
      promedio: Math.round((totales[indice] / semanas) * 10) / 10,
    })),
    pico: maximo > 0 ? DIAS[totales.indexOf(maximo)].nombre : null,
    semanas,
  };
}

/** Una tarjeta de «Resumen de hoy»: un área, su número, el detalle y a qué sección de Gestión lleva. */
export type ResumenArea = {
  area: 'reservas' | 'asesorias' | 'capacitaciones' | 'tablets';
  titulo: string;
  icono: string;
  /** El número grande. */
  valor: number;
  /** Lo que dice el número, por ejemplo «por revisar» o «prestadas». */
  unidad: string;
  detalle: string;
  seccion: ValorSeccionGestion;
};

/** «1 vencida» o «3 vencidas». */
const contar = (cantidad: number, singular: string, plural: string) =>
  `${cantidad} ${cantidad === 1 ? singular : plural}`;

/**
 * Una tarjeta por cada área que la persona tiene (solo las listas que llegaron): lo que espera
 * respuesta y lo de hoy en reservas, asesorías y capacitaciones, y las tablets prestadas.
 */
export function resumenPorArea(
  { reservas, citas, capacitaciones, prestamos }: DatosPanel,
  hoy: string,
): ResumenArea[] {
  const areas: ResumenArea[] = [];
  if (reservas) {
    const deHoy = reservas.filter((r) => r.estado === 'aprobada' && r.fecha === hoy).length;
    areas.push({
      area: 'reservas',
      titulo: 'Reservas de espacios',
      icono: 'door-open',
      valor: reservas.filter((r) => r.estado === 'pendiente').length,
      unidad: 'por revisar',
      detalle: `${contar(deHoy, 'reserva', 'reservas')} hoy`,
      seccion: 'solicitudes',
    });
  }
  if (citas) {
    const deHoy = citas.filter((c) => c.estado === 'aprobada' && c.fecha === hoy);
    const virtuales = deHoy.filter((c) => c.modalidad === 'virtual').length;
    areas.push({
      area: 'asesorias',
      titulo: 'Asesorías',
      icono: 'account-voice',
      valor: citas.filter((c) => c.estado === 'pendiente').length,
      unidad: 'por revisar',
      detalle: `${deHoy.length} hoy · ${contar(virtuales, 'virtual', 'virtuales')}`,
      seccion: 'agenda',
    });
  }
  if (capacitaciones) {
    const proximas = capacitaciones.filter((s) => s.estado === 'aprobada' && s.fecha >= hoy).length;
    areas.push({
      area: 'capacitaciones',
      titulo: 'Capacitaciones',
      icono: 'school-outline',
      valor: capacitaciones.filter((s) => s.estado === 'pendiente').length,
      unidad: 'por revisar',
      detalle: `${contar(proximas, 'próxima aprobada', 'próximas aprobadas')}`,
      seccion: 'solicitudes',
    });
  }
  if (prestamos) {
    const vencidas = prestamos.filter((p) => p.estado === 'vencido').length;
    const apartadas = prestamos.filter((p) => p.estado === 'reservado' && p.fecha === hoy).length;
    areas.push({
      area: 'tablets',
      titulo: 'Tablets',
      icono: 'tablet',
      valor: prestamos.filter((p) => p.estado === 'entregado' || p.estado === 'vencido').length,
      unidad: 'prestadas',
      detalle: `${contar(vencidas, 'vencida', 'vencidas')} · ${contar(apartadas, 'apartada', 'apartadas')} hoy`,
      // Con préstamos vencidos, la tarjeta lleva a Vencidos: es lo urgente.
      seccion: vencidas > 0 ? 'vencidos' : 'prestamos',
    });
  }
  return areas;
}
