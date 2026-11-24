/**
 * Espacios y reservas del Backend traducidos a la app (HU-16, HU-17 y HU-18). Funciones puras.
 *
 * - `GET /spaces/` → `{message, spaces}`; cada espacio trae sus horarios (`0` = lunes).
 * - `GET /spaces/{id}/availability/?view=month&date=` → los días del mes con sus tramos
 *   (`available`, `reserved` o `blocked`) de largo variable: la app los parte en franjas de una
 *   hora y marca «no disponible» lo que no cumple la anticipación mínima, como sus datos de prueba.
 * - `POST /spaces/reservations/` → la reserva; un 409 trae tramos libres del mismo día.
 * - Mis reservas salen de `GET /me/requests/?service=SPACE_RESERVATION` y su detalle, que trae el
 *   nombre del espacio pero no su id: se busca en el catálogo por el nombre.
 */
import type {
  DatosSolicitante,
  DiaDisponibilidad,
  Espacio,
  EstadoFranja,
  FranjaDisponibilidad,
  RecursoApoyo,
  Reserva,
} from '@/types';
import { aHora, aMinutos } from '@/utils/franjas';

import {
  diaDesdeBackend,
  ESTADO_DESDE_BACKEND,
  horaDesdeBackend,
  sedeHaciaBackend,
  type EstadoBackend,
} from './equivalencias';

export type HorarioEspacioBackend = {
  day_of_week: number;
  day_of_week_display: string;
  start_time: string;
  end_time: string;
};

export type EspacioBackend = {
  id: number;
  name: string;
  description: string;
  capacity: number;
  photo: string | null;
  location_display?: string | null;
  schedules: HorarioEspacioBackend[];
};

export type DiaBackend = {
  date: string;
  is_open: boolean;
  closed_reason: string | null;
  slots: { start: string; end: string; state: 'available' | 'reserved' | 'blocked' }[];
};

export type DisponibilidadBackend = { days: DiaBackend[] };

const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * El horario como texto, juntando los días seguidos con las mismas horas:
 * «Lunes a viernes: 08:00–12:00 y 14:00–18:00 · Sábado: 08:00–12:00».
 */
export function textoHorario(horarios: HorarioEspacioBackend[]): string {
  const porDia = new Map<number, string[]>();
  for (const horario of horarios) {
    const dia = diaDesdeBackend(horario.day_of_week);
    const tramo = `${horaDesdeBackend(horario.start_time)}–${horaDesdeBackend(horario.end_time)}`;
    porDia.set(dia, [...(porDia.get(dia) ?? []), tramo]);
  }
  // De lunes (1) a domingo (0).
  const dias = [1, 2, 3, 4, 5, 6, 0].filter((dia) => porDia.has(dia));
  const grupos: { desde: number; hasta: number; horas: string }[] = [];
  for (const dia of dias) {
    const horas = porDia.get(dia)!.sort().join(' y ');
    const ultimo = grupos[grupos.length - 1];
    const siguiente = ultimo ? (ultimo.hasta + 1) % 7 : -1;
    if (ultimo && ultimo.horas === horas && siguiente === dia) ultimo.hasta = dia;
    else grupos.push({ desde: dia, hasta: dia, horas });
  }
  return grupos
    .map(({ desde, hasta, horas }) => {
      const dias =
        desde === hasta
          ? NOMBRES_DIA[desde]
          : `${NOMBRES_DIA[desde]} a ${NOMBRES_DIA[hasta].toLowerCase()}`;
      return `${dias}: ${horas}`;
    })
    .join(' · ');
}

export function espacioDesdeBackend(espacio: EspacioBackend): Espacio {
  return {
    id: String(espacio.id),
    nombre: espacio.name,
    descripcion: espacio.description,
    capacidad: espacio.capacity,
    ...(espacio.photo ? { foto: espacio.photo } : {}),
    horario: textoHorario(espacio.schedules),
    // El catálogo público solo trae los espacios activos.
    activo: true,
  };
}

export type HorarioAdminBackend = HorarioEspacioBackend & { id: number; is_active: boolean };
export type EspacioAdminBackend = Omit<EspacioBackend, 'schedules'> & {
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  schedules: HorarioAdminBackend[];
};

export function espacioAdminDesdeBackend(espacio: EspacioAdminBackend): Espacio {
  return {
    ...espacioDesdeBackend({
      ...espacio,
      schedules: espacio.schedules.filter((horario) => horario.is_active),
    }),
    activo: espacio.status === 'ACTIVE',
  };
}

type HorarioEscritura = Pick<HorarioEspacioBackend, 'day_of_week' | 'start_time' | 'end_time'>;

export function horariosHaciaBackend(texto: string): HorarioEscritura[] | undefined {
  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const normalizado = texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').trim();
  if (!normalizado) return [];
  const horarios: HorarioEscritura[] = [];
  for (const grupo of normalizado.split(/\s*[·;\n]\s*/)) {
    const partes = /^([a-z]+)(?:\s+a\s+([a-z]+))?\s*[:,]\s*(.+)$/.exec(grupo);
    if (!partes) return undefined;
    const inicio = dias.indexOf(partes[1]);
    const fin = dias.indexOf(partes[2] ?? partes[1]);
    if (inicio < 0 || fin < inicio) return undefined;
    for (const tramo of partes[3].split(/\s+y\s+/)) {
      const horas = /^((?:[01]\d|2[0-3]):[0-5]\d)\s*(?:[–-]|a)\s*((?:[01]\d|2[0-3]):[0-5]\d)$/.exec(tramo);
      if (!horas || horas[1] >= horas[2]) return undefined;
      for (let dia = inicio; dia <= fin; dia += 1) {
        if (horarios.some((h) => h.day_of_week === dia && h.start_time < horas[2] && horas[1] < h.end_time)) {
          return undefined;
        }
        horarios.push({ day_of_week: dia, start_time: horas[1], end_time: horas[2] });
      }
    }
  }
  return horarios;
}

export async function cuerpoEspacio(datos: Omit<Espacio, 'id'>, anterior?: EspacioAdminBackend) {
  const campos = { name: datos.nombre, description: datos.descripcion, capacity: datos.capacidad };
  const foto = datos.foto;
  if (!foto || foto === anterior?.photo || /^https?:/.test(foto)) {
    return JSON.stringify(!foto && anterior?.photo ? { ...campos, photo: null } : campos);
  }
  const cuerpo = new FormData();
  for (const [campo, valor] of Object.entries(campos)) cuerpo.append(campo, String(valor));
  if (/^(blob|data):/.test(foto)) {
    const archivo = await (await fetch(foto)).blob();
    const extension = archivo.type.split('/')[1] || 'jpg';
    cuerpo.append('photo', archivo, `espacio.${extension}`);
  } else {
    const extension = /\.(png|webp)(?:$|\?)/i.exec(foto)?.[1].toLowerCase() ?? 'jpeg';
    cuerpo.append('photo', {
      uri: foto, name: `espacio.${extension}`, type: `image/${extension}`,
    } as unknown as Blob);
  }
  return cuerpo;
}

type Tramo = { inicio: number; fin: number; estado: DiaBackend['slots'][number]['state'] };

/** Los tramos abiertos del día: los del Backend que se tocan, juntos (08:00–12:00, 14:00–18:00). */
function rangosAbiertos(tramos: Tramo[]): { inicio: number; fin: number }[] {
  const rangos: { inicio: number; fin: number }[] = [];
  for (const { inicio, fin } of [...tramos].sort((a, b) => a.inicio - b.inicio)) {
    const ultimo = rangos[rangos.length - 1];
    if (ultimo && inicio <= ultimo.fin) ultimo.fin = Math.max(ultimo.fin, fin);
    else rangos.push({ inicio, fin });
  }
  return rangos;
}

/**
 * Un día del Backend como lo pinta la app: franjas de una hora desde la apertura de cada tramo
 * abierto, como los datos de prueba. Una hora queda bloqueada o reservada si cualquier parte de
 * ella lo está (una reserva de 09:00 a 10:30 ocupa las franjas de 09:00 y de 10:00). Una franja
 * libre que empieza antes de `minimo` queda «no disponible», con el mismo motivo que los datos de
 * prueba.
 */
export function diaDesdeDisponibilidad(
  dia: DiaBackend,
  minimo: Date,
  horasMinimas: number,
  ahora: Date = new Date(),
): DiaDisponibilidad {
  if (!dia.is_open) {
    return {
      fecha: dia.date,
      habil: false,
      motivo: dia.closed_reason ?? undefined,
      franjas: [],
    };
  }
  const tramos: Tramo[] = dia.slots.map((tramo) => ({
    inicio: aMinutos(horaDesdeBackend(tramo.start)),
    fin: aMinutos(horaDesdeBackend(tramo.end)),
    estado: tramo.state,
  }));
  const ocupa = (estado: Tramo['estado'], inicio: number, fin: number) =>
    tramos.some((t) => t.estado === estado && t.inicio < fin && inicio < t.fin);

  const franjas: FranjaDisponibilidad[] = [];
  for (const rango of rangosAbiertos(tramos)) {
    for (let inicio = rango.inicio; inicio + 60 <= rango.fin; inicio += 60) {
      let estado: EstadoFranja = 'disponible';
      if (ocupa('blocked', inicio, inicio + 60)) estado = 'bloqueada';
      else if (ocupa('reserved', inicio, inicio + 60)) estado = 'reservada';
      let motivo: string | undefined;
      const empieza = new Date(`${dia.date}T${aHora(inicio)}:00`);
      if (estado === 'disponible' && empieza < minimo) {
        estado = 'no_disponible';
        motivo = empieza < ahora ? 'Ya pasó' : `Faltan menos de ${horasMinimas} h para solicitarla`;
      } else if (estado === 'bloqueada') {
        motivo = 'Bloqueado por la biblioteca';
      }
      franjas.push({
        horaInicio: aHora(inicio),
        horaFin: aHora(inicio + 60),
        estado,
        ...(motivo ? { motivo } : {}),
      });
    }
  }
  return { fecha: dia.date, habil: true, franjas };
}

/** Los primeros días de cada mes entre dos fechas, para pedir la vista mensual. */
export function mesesEntre(desde: string, hasta: string): string[] {
  const meses: string[] = [];
  let [anio, mes] = desde.split('-').map(Number);
  const [anioFin, mesFin] = hasta.split('-').map(Number);
  while (anio < anioFin || (anio === anioFin && mes <= mesFin)) {
    meses.push(`${anio}-${String(mes).padStart(2, '0')}-01`);
    mes += 1;
    if (mes === 13) {
      mes = 1;
      anio += 1;
    }
  }
  return meses;
}

const RECURSO_HACIA_BACKEND: Record<RecursoApoyo, string> = {
  portatil: 'LAPTOP',
  hdmi: 'HDMI',
  cable_red: 'NETWORK_CABLE',
  mouse: 'MOUSE',
  marcadores: 'MARKERS',
};

const NIVEL_HACIA_BACKEND = { pregrado: 'UNDERGRADUATE', posgrado: 'POSTGRADUATE', otro: 'OTHER' };

/** «Tus datos» de cualquier solicitud (2.1.0): lo que no va, el Backend lo toma del perfil. */
export function datosSolicitanteHaciaBackend(datos: DatosSolicitante | undefined) {
  if (!datos) return {};
  const sede = sedeHaciaBackend(datos.sede);
  return {
    contact_phone: datos.celular,
    ...(sede ? { campus: sede } : {}),
    ...(datos.nivel ? { education_level: NIVEL_HACIA_BACKEND[datos.nivel] } : {}),
    ...(datos.facultad ? { faculty: datos.facultad } : {}),
    ...(datos.programa ? { program: datos.programa } : {}),
    ...(datos.semestre != null ? { semester: String(datos.semestre) } : {}),
  };
}

/** Lo que la app pide al reservar, con los nombres del Backend. */
export function reservaHaciaBackend(datos: {
  espacioId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  proposito: string;
  asistentes: number;
  requerimientos?: string;
  recursos?: RecursoApoyo[];
  datosSolicitante?: DatosSolicitante;
  terminosAceptados?: boolean;
}) {
  return {
    space: Number(datos.espacioId),
    date: datos.fecha,
    start_time: datos.horaInicio,
    end_time: datos.horaFin,
    purpose: datos.proposito,
    estimated_attendees: datos.asistentes,
    additional_requirements: datos.requerimientos ?? '',
    support_resources: (datos.recursos ?? []).map((recurso) => RECURSO_HACIA_BACKEND[recurso]),
    ...datosSolicitanteHaciaBackend(datos.datosSolicitante),
    accept_terms: datos.terminosAceptados === true,
  };
}

/** La reserva recién creada (`SpaceReservation`). El id es el de la solicitud (`request_id`). */
export type ReservaBackend = {
  request_id: number;
  status: EstadoBackend;
  space: number;
  date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  estimated_attendees: number;
  additional_requirements?: string;
};

export function reservaDesdeBackend(
  reserva: ReservaBackend,
  solicitante: { id: string; nombre: string },
): Reserva {
  return {
    id: String(reserva.request_id),
    espacioId: String(reserva.space),
    solicitanteId: solicitante.id,
    solicitante: solicitante.nombre,
    fecha: reserva.date,
    horaInicio: horaDesdeBackend(reserva.start_time),
    horaFin: horaDesdeBackend(reserva.end_time),
    proposito: reserva.purpose,
    asistentes: reserva.estimated_attendees,
    estado: ESTADO_DESDE_BACKEND[reserva.status],
    ...(reserva.additional_requirements ? { requerimientos: reserva.additional_requirements } : {}),
  };
}

/** Una de «Mis solicitudes» con su detalle (`GET /me/requests/{id}/`). */
export type DetalleSolicitudBackend = {
  id: number;
  status: EstadoBackend;
  details: Record<string, unknown>;
  history?: { reason: string; new_status: EstadoBackend }[];
};

/** Una reserva de «Mis solicitudes». `espacios` da el id del espacio por su nombre. */
export function miReservaDesdeBackend(
  solicitud: DetalleSolicitudBackend,
  solicitante: { id: string; nombre: string },
  espacios: Espacio[],
): Reserva {
  const detalle = solicitud.details as {
    space: string;
    date: string;
    start_time: string;
    end_time: string;
    purpose: string;
    estimated_attendees: number;
  };
  const estado = ESTADO_DESDE_BACKEND[solicitud.status];
  // El motivo de un rechazo o una cancelación es el del último cambio a ese estado.
  const ultimo = [...(solicitud.history ?? [])]
    .reverse()
    .find((cambio) => cambio.new_status === solicitud.status && cambio.reason);
  return {
    id: String(solicitud.id),
    espacioId: espacios.find((espacio) => espacio.nombre === detalle.space)?.id ?? '',
    solicitanteId: solicitante.id,
    solicitante: solicitante.nombre,
    fecha: detalle.date,
    horaInicio: horaDesdeBackend(detalle.start_time),
    horaFin: horaDesdeBackend(detalle.end_time),
    proposito: detalle.purpose,
    asistentes: detalle.estimated_attendees,
    estado,
    ...((estado === 'rechazada' || estado === 'cancelada') && ultimo
      ? { motivo: ultimo.reason }
      : {}),
  };
}

/**
 * Las alternativas de un 409 (`alternative_slots`: tramos libres del mismo día) con la duración
 * que pidió la persona.
 */
export function alternativasDesdeBackend(
  tramos: { start_time: string; end_time: string }[],
  fecha: string,
  duracionMinutos: number,
) {
  return tramos
    .filter((tramo) => aMinutos(tramo.end_time) - aMinutos(tramo.start_time) >= duracionMinutos)
    .map((tramo) => ({
      fecha,
      horaInicio: horaDesdeBackend(tramo.start_time),
      horaFin: aHora(aMinutos(tramo.start_time) + duracionMinutos),
    }));
}
