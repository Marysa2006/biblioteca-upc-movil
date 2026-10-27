/**
 * Asesorías: temas y jornadas del personal (HU-13) y citas de la comunidad (HU-14).
 * Lista y guarda temas y jornadas; al guardar una jornada genera sus franjas (CA1).
 * La comunidad consulta las franjas libres y agenda, cancela o reprograma sus citas.
 * Las rutas son provisionales: confírmenlas con el equipo de Backend.
 */
import type {
  Cita,
  EstadoSolicitud,
  FranjaAsesoria,
  Jornada,
  Parametros,
  TemaAsesoria,
  Usuario,
} from '@/types';
import { esFechaValida, esHoraValida, hoyISO } from '@/utils/fechas';
import { aMinutos, generarFranjas } from '@/utils/franjas';
import { problemaHorario } from '@/utils/reservas';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import {
  CITAS_ASESORIA,
  FRANJAS_ASESORIA,
  JORNADAS_ASESORIA,
  TEMAS_ASESORIA,
} from './mocks/asesorias';
import { USUARIOS_DIRECTORIO } from './mocks/usuarios';
import { crearNotificacion } from './notificaciones';
import { obtenerParametros } from './parametros';

/** Copias mutables: con mocks, lo que se crea o edita se ve durante la sesión. */
let temas: TemaAsesoria[] = TEMAS_ASESORIA.map((tema) => ({ ...tema }));
let jornadas: Jornada[] = JORNADAS_ASESORIA.map((jornada) => ({ ...jornada }));
let franjas = FRANJAS_ASESORIA.map((franja) => ({ ...franja }));
let citas: Cita[] = CITAS_ASESORIA.map((cita) => ({ ...cita }));

/** Datos del formulario de un tema; sin id crea y con id edita. */
export type DatosTema = Omit<TemaAsesoria, 'id'> & { id?: string };

/** Datos del formulario de una jornada; sin id crea y con id edita. */
export type DatosJornada = Omit<Jornada, 'id'> & { id?: string };

/** Resultado de guardar una jornada (CA1): cuántas franjas generó. */
export type ResultadoJornada = {
  jornada: Jornada;
  franjasGeneradas: number;
};

/** Todos los temas, también los inactivos, para la administración (HU-13). */
export function obtenerTemas(): Promise<TemaAsesoria[]> {
  if (USAR_MOCKS) {
    return simularRed(temas.map((tema) => ({ ...tema })));
  }
  return peticion<TemaAsesoria[]>('/asesorias/temas/');
}

export function guardarTema(datos: DatosTema): Promise<TemaAsesoria> {
  if (USAR_MOCKS) {
    if (!datos.nombre?.trim()) {
      return Promise.reject(new ErrorApi(400, 'El nombre del tema es obligatorio.'));
    }
    if (datos.id) {
      const indice = temas.findIndex((tema) => tema.id === datos.id);
      if (indice === -1) {
        return Promise.reject(new ErrorApi(404, 'El tema no existe.'));
      }
      const actualizado: TemaAsesoria = { ...datos, id: datos.id };
      temas = temas.map((tema, i) => (i === indice ? actualizado : tema));
      return simularRed({ ...actualizado });
    }
    const nuevo: TemaAsesoria = { ...datos, id: `tema-${Date.now()}` };
    temas = [...temas, nuevo];
    return simularRed({ ...nuevo });
  }
  return datos.id
    ? peticion<TemaAsesoria>(`/asesorias/temas/${datos.id}/`, {
        method: 'PUT',
        body: JSON.stringify(datos),
      })
    : peticion<TemaAsesoria>('/asesorias/temas/', {
        method: 'POST',
        body: JSON.stringify(datos),
      });
}

/** Todas las jornadas, para la administración (HU-13). */
export function obtenerJornadas(): Promise<Jornada[]> {
  if (USAR_MOCKS) {
    return simularRed(jornadas.map((jornada) => ({ ...jornada })));
  }
  return peticion<Jornada[]>('/asesorias/jornadas/');
}

/** Validación de la jornada: datos coherentes y sin traslape con otra del facilitador (CA2). */
function errorDeJornada(datos: DatosJornada): ErrorApi | null {
  if (!datos.temaId) {
    return new ErrorApi(400, 'Elige el tema.');
  }
  if (!datos.facilitadorId) {
    return new ErrorApi(400, 'Elige el facilitador.');
  }
  if (datos.dias.length === 0) {
    return new ErrorApi(400, 'Elige al menos un día.');
  }
  if (datos.dias.some((dia) => !Number.isInteger(dia) || dia < 0 || dia > 6)) {
    return new ErrorApi(400, 'Los días de la semana no son válidos.');
  }
  if (datos.modalidad !== 'presencial' && datos.modalidad !== 'virtual') {
    return new ErrorApi(400, 'La modalidad no es válida.');
  }
  if (!esHoraValida(datos.horaInicio) || !esHoraValida(datos.horaFin)) {
    return new ErrorApi(400, 'Usa el formato HH:MM en el horario.');
  }
  const problema = problemaHorario(datos.horaInicio, datos.horaFin);
  if (problema) {
    return new ErrorApi(400, problema.mensaje);
  }
  if (!Number.isInteger(datos.duracionMinutos) || datos.duracionMinutos <= 0) {
    return new ErrorApi(400, 'La duración de la franja debe ser mayor que cero.');
  }
  if (!Number.isInteger(datos.cupos) || datos.cupos < 1) {
    return new ErrorApi(400, 'Los cupos por franja deben ser al menos 1.');
  }
  if (!esFechaValida(datos.vigenciaDesde) || !esFechaValida(datos.vigenciaHasta)) {
    return new ErrorApi(400, 'Usa el formato AAAA-MM-DD en la vigencia.');
  }
  if (datos.vigenciaDesde > datos.vigenciaHasta) {
    return new ErrorApi(400, 'La vigencia está cruzada.');
  }
  if (aMinutos(datos.horaInicio) + datos.duracionMinutos > aMinutos(datos.horaFin)) {
    return new ErrorApi(400, 'La franja no cabe en el horario de la jornada.');
  }
  const choca = jornadas.some(
    (jornada) =>
      jornada.id !== datos.id &&
      jornada.activa &&
      datos.activa &&
      jornada.facilitadorId === datos.facilitadorId &&
      jornada.dias.some((dia) => datos.dias.includes(dia)) &&
      jornada.vigenciaDesde <= datos.vigenciaHasta &&
      datos.vigenciaDesde <= jornada.vigenciaHasta &&
      aMinutos(datos.horaInicio) < aMinutos(jornada.horaFin) &&
      aMinutos(jornada.horaInicio) < aMinutos(datos.horaFin),
  );
  if (choca) {
    return new ErrorApi(400, 'La jornada se traslapa con otra del mismo facilitador.');
  }
  return null;
}

/**
 * Crea o edita una jornada y genera sus franjas (CA1), sin las fechas excluidas (CA3).
 * Devuelve la jornada y cuántas franjas quedaron.
 */
export async function guardarJornada(datos: DatosJornada): Promise<ResultadoJornada> {
  if (USAR_MOCKS) {
    if (datos.id && !jornadas.some((actual) => actual.id === datos.id)) {
      throw new ErrorApi(404, 'La jornada no existe.');
    }
    const error = errorDeJornada(datos);
    if (error) {
      throw error;
    }
    const id = datos.id ?? `jor-${Date.now()}`;
    const jornada: Jornada = { ...datos, id };
    const parametros: Parametros = await obtenerParametros();
    const nuevas = generarFranjas(jornada, parametros);

    // Reemplaza las franjas de esta jornada y conserva las de las demás.
    franjas = [...franjas.filter((franja) => franja.jornadaId !== id), ...nuevas];

    if (datos.id) {
      jornadas = jornadas.map((actual) => (actual.id === datos.id ? jornada : actual));
    } else {
      jornadas = [...jornadas, jornada];
    }

    return simularRed({ jornada: { ...jornada }, franjasGeneradas: nuevas.length });
  }
  return datos.id
    ? peticion<ResultadoJornada>(`/asesorias/jornadas/${datos.id}/`, {
        method: 'PUT',
        body: JSON.stringify(datos),
      })
    : peticion<ResultadoJornada>('/asesorias/jornadas/', {
        method: 'POST',
        body: JSON.stringify(datos),
      });
}

// ── HU-14: agendar, cancelar y reprogramar citas ───────────────

/** Estados en los que la cita sigue activa: ocupa cupo y se puede cancelar o reprogramar. */
const ESTADOS_ACTIVOS: readonly EstadoSolicitud[] = ['pendiente', 'aprobada'];

/** ¿Faltan al menos `horas` para el inicio? (anticipación de los parámetros, HU-28). */
function cumpleAnticipacion(fecha: string, horaInicio: string, horas: number): boolean {
  const inicio = new Date(`${fecha}T${horaInicio}:00`);
  return inicio.getTime() >= Date.now() + horas * 60 * 60 * 1000;
}

function ordenarPorFecha<T extends { fecha: string; horaInicio: string }>(lista: T[]): T[] {
  return [...lista].sort((a, b) =>
    a.fecha === b.fecha ? a.horaInicio.localeCompare(b.horaInicio) : a.fecha.localeCompare(b.fecha),
  );
}

/** Suma `cambio` a los cupos libres de la franja, entre 0 y los cupos de la jornada. */
function ajustarCupo(franjaId: string, cambio: number) {
  franjas = franjas.map((franja) => {
    if (franja.id !== franjaId) return franja;
    const maximo = jornadas.find((j) => j.id === franja.jornadaId)?.cupos ?? Infinity;
    const cuposLibres = Math.max(0, Math.min(franja.cuposLibres + cambio, maximo));
    return { ...franja, cuposLibres };
  });
}

/** Lo que una cita toma de su franja: tema, facilitador, fecha, horas y modalidad. */
type DatosDeFranja = Pick<
  Cita,
  | 'franjaId'
  | 'temaId'
  | 'tema'
  | 'facilitadorId'
  | 'facilitador'
  | 'fecha'
  | 'horaInicio'
  | 'horaFin'
  | 'modalidad'
>;

/** Valida que el usuario pueda pedir la franja (cupo, CA2, y anticipación) y da sus datos. */
function datosDeFranja(franjaId: string, usuarioId: string, parametros: Parametros): DatosDeFranja {
  const franja = franjas.find((f) => f.id === franjaId);
  if (!franja) {
    throw new ErrorApi(404, 'La franja no existe.');
  }
  const jornada = jornadas.find((j) => j.id === franja.jornadaId);
  const tema = temas.find((t) => t.id === franja.temaId);
  if (!jornada?.activa || !tema?.activo) {
    throw new ErrorApi(400, 'Esa franja ya no está disponible.');
  }
  if (franja.cuposLibres < 1) {
    throw new ErrorApi(400, 'Esa franja ya no tiene cupo. Elige otra.');
  }
  if (!cumpleAnticipacion(franja.fecha, franja.horaInicio, parametros.horasMinimasSolicitud)) {
    throw new ErrorApi(
      400,
      `Las asesorías se piden con ${parametros.horasMinimasSolicitud} horas de anticipación.`,
    );
  }
  const repetida = citas.some(
    (cita) =>
      cita.solicitanteId === usuarioId &&
      cita.franjaId === franja.id &&
      ESTADOS_ACTIVOS.includes(cita.estado),
  );
  if (repetida) {
    throw new ErrorApi(400, 'Ya tienes una cita en esa franja.');
  }
  const facilitador = USUARIOS_DIRECTORIO.find((u) => u.id === franja.facilitadorId);
  return {
    franjaId: franja.id,
    temaId: tema.id,
    tema: tema.nombre,
    facilitadorId: franja.facilitadorId,
    facilitador: facilitador?.nombre ?? 'Facilitador',
    fecha: franja.fecha,
    horaInicio: franja.horaInicio,
    horaFin: franja.horaFin,
    modalidad: jornada.modalidad,
  };
}

/** Cita activa del usuario que sigue dentro del plazo de cancelación (CA3). */
function citaModificable(
  usuarioId: string,
  id: string,
  parametros: Parametros,
  accion: 'cancelar' | 'reprogramar',
): Cita {
  const cita = citas.find((c) => c.id === id && c.solicitanteId === usuarioId);
  if (!cita) {
    throw new ErrorApi(404, 'La cita no existe.');
  }
  if (!ESTADOS_ACTIVOS.includes(cita.estado)) {
    throw new ErrorApi(400, `Esta cita ya no se puede ${accion}.`);
  }
  if (!cumpleAnticipacion(cita.fecha, cita.horaInicio, parametros.horasMinimasCancelacion)) {
    throw new ErrorApi(
      400,
      `Solo puedes ${accion} hasta ${parametros.horasMinimasCancelacion} horas antes.`,
    );
  }
  return cita;
}

/**
 * Franjas de un tema que se pueden pedir: futuras, con cupo y con la anticipación mínima
 * (HU-14, CA1). Si no hay, devuelve [] para que la pantalla lo informe (CA4).
 */
export async function obtenerFranjas(
  temaId: string,
  desde: string,
  hasta: string,
): Promise<FranjaAsesoria[]> {
  if (USAR_MOCKS) {
    const parametros = await obtenerParametros();
    if (!temas.find((t) => t.id === temaId)?.activo) {
      return simularRed([]);
    }
    const hoy = hoyISO();
    const disponibles = franjas.filter(
      (franja) =>
        franja.temaId === temaId &&
        franja.fecha >= desde &&
        franja.fecha <= hasta &&
        franja.fecha >= hoy &&
        franja.cuposLibres > 0 &&
        jornadas.find((j) => j.id === franja.jornadaId)?.activa === true &&
        cumpleAnticipacion(franja.fecha, franja.horaInicio, parametros.horasMinimasSolicitud),
    );
    return simularRed(ordenarPorFecha(disponibles).map((franja) => ({ ...franja })));
  }
  return peticion<FranjaAsesoria[]>(
    `/asesorias/temas/${temaId}/franjas/?desde=${desde}&hasta=${hasta}`,
  );
}

/** Agenda una cita y la confirma (CA1). Si la franja se llenó, la rechaza (CA2). */
export async function agendarCita(
  usuario: Usuario,
  franjaId: string,
  necesidad: string,
): Promise<Cita> {
  if (USAR_MOCKS) {
    if (!necesidad?.trim()) {
      throw new ErrorApi(400, 'Cuéntanos brevemente qué necesitas.');
    }
    const parametros = await obtenerParametros();
    const cita: Cita = {
      ...datosDeFranja(franjaId, usuario.id, parametros),
      id: `cit-${Date.now()}`,
      solicitanteId: usuario.id,
      solicitante: usuario.nombre,
      necesidad: necesidad.trim(),
      estado: 'aprobada',
    };
    citas = [...citas, cita];
    ajustarCupo(franjaId, -1);
    crearNotificacion({
      usuarioId: usuario.id,
      solicitudId: cita.id,
      titulo: 'Asesoría agendada',
      mensaje: `Tu asesoría de ${cita.tema} quedó para el ${cita.fecha} a las ${cita.horaInicio}.`,
    });
    return simularRed({ ...cita });
  }
  return peticion<Cita>('/asesorias/citas/', {
    method: 'POST',
    body: JSON.stringify({ franjaId, necesidad }),
  });
}

/** Citas del usuario de la sesión, por fecha (HU-14 y HU-15). */
export function obtenerMisCitas(usuarioId: string): Promise<Cita[]> {
  if (USAR_MOCKS) {
    const mias = citas.filter((cita) => cita.solicitanteId === usuarioId);
    return simularRed(ordenarPorFecha(mias).map((cita) => ({ ...cita })));
  }
  return peticion<Cita[]>('/asesorias/citas/mias/');
}

/** Cancela una cita dentro del plazo y libera el cupo (CA3). */
export async function cancelarCita(usuario: Usuario, id: string): Promise<Cita> {
  if (USAR_MOCKS) {
    const parametros = await obtenerParametros();
    const cita = citaModificable(usuario.id, id, parametros, 'cancelar');
    const cancelada: Cita = { ...cita, estado: 'cancelada', motivo: 'Cancelada por el usuario.' };
    citas = citas.map((c) => (c.id === id ? cancelada : c));
    ajustarCupo(cita.franjaId, 1);
    crearNotificacion({
      usuarioId: usuario.id,
      solicitudId: cita.id,
      titulo: 'Asesoría cancelada',
      mensaje: `Tu asesoría de ${cita.tema} del ${cita.fecha} a las ${cita.horaInicio} fue cancelada.`,
    });
    return simularRed({ ...cancelada });
  }
  return peticion<Cita>(`/asesorias/citas/${id}/cancelar/`, { method: 'POST' });
}

/**
 * Pasa una cita a otra franja del mismo tema, dentro del plazo de cancelación (CA3).
 * Libera el cupo de la franja anterior y ocupa uno de la nueva.
 */
export async function reprogramarCita(
  usuario: Usuario,
  id: string,
  nuevaFranjaId: string,
): Promise<Cita> {
  if (USAR_MOCKS) {
    const parametros = await obtenerParametros();
    const cita = citaModificable(usuario.id, id, parametros, 'reprogramar');
    if (cita.franjaId === nuevaFranjaId) {
      throw new ErrorApi(400, 'Elige una franja diferente.');
    }
    const datos = datosDeFranja(nuevaFranjaId, usuario.id, parametros);
    if (datos.temaId !== cita.temaId) {
      throw new ErrorApi(400, 'Elige una franja del mismo tema.');
    }
    const actualizada: Cita = { ...cita, ...datos, estado: 'aprobada', motivo: undefined };
    citas = citas.map((c) => (c.id === id ? actualizada : c));
    ajustarCupo(cita.franjaId, 1);
    ajustarCupo(nuevaFranjaId, -1);
    crearNotificacion({
      usuarioId: usuario.id,
      solicitudId: cita.id,
      titulo: 'Asesoría reprogramada',
      mensaje: `Tu asesoría de ${actualizada.tema} quedó para el ${actualizada.fecha} a las ${actualizada.horaInicio}.`,
    });
    return simularRed({ ...actualizada });
  }
  return peticion<Cita>(`/asesorias/citas/${id}/reprogramar/`, {
    method: 'POST',
    body: JSON.stringify({ nuevaFranjaId }),
  });
}
