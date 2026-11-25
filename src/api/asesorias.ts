/**
 * Asesorías: temas y jornadas del personal (HU-13), citas de la comunidad (HU-14) y agenda
 * del facilitador (HU-15).
 * Lista y guarda temas y jornadas; al guardar una jornada genera sus franjas (CA1).
 * La comunidad consulta las franjas libres y agenda, cancela o reprograma sus citas.
 * El facilitador consulta su agenda y registra el resultado o la inasistencia.
 */
import type {
  Cita,
  EstadoSolicitud,
  FranjaAsesoria,
  Jornada,
  NuevaSolicitudCita,
  Parametros,
  TemaAsesoria,
  TipoUsuario,
  Usuario,
} from '@/types';
import {
  crearCalificacion,
  MENSAJE_INVITACION_CALIFICAR,
  notaCalificacion,
  problemaCalificacion,
  type DatosCalificacion,
} from '@/utils/calificacion';
import { esFechaValida, esHoraValida, fechaLegible, hoyISO } from '@/utils/fechas';
import { aHora, aMinutos, conservarFranjas, generarFranjas } from '@/utils/franjas';
import { horariosDeFecha, motivoNoDisponible } from '@/utils/parametros';
import { problemaHorario } from '@/utils/reservas';
import { tienePermiso } from '@/utils/roles';

import { useSesion } from '@/store/sesion';

import {
  citaAgendaDesdeBackend,
  citaDesdeBackend,
  citaGestionDesdeBackend,
  citaHaciaBackend,
  temaDesdeBackend,
  temaHaciaBackend,
  type CitaBackend,
  type CitaGestionBackend,
  type DetalleAgendaBackend,
  type TemaBackend,
} from './backend/asesorias';
import { usuarioDirectorioDesdeBackend, type UsuarioBackend } from './backend/usuarios';
import { ErrorApi, peticion, peticionTodas, simularRed, usaApi, USAR_MOCKS } from './cliente';
import {
  CITAS_ASESORIA,
  FRANJAS_ASESORIA,
  JORNADAS_ASESORIA,
  TEMAS_ASESORIA,
} from './mocks/asesorias';
import { USUARIOS_DIRECTORIO } from './mocks/usuarios';
import { datosDeSolicitante, registrarUso } from './estadisticas';
import { registrarEvento } from './historial';
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

// ── Con la API (módulo `asesorias` de `usaApi()`) ─────────────────────────────────────────

/** request_id de la app → id de la cita en el Backend, para cancelar, reprogramar y calificar. */
const idsCita = new Map<string, number>();
const RUTA_GESTION = '/advisories/manage/appointments/';
const RUTA_AGENDA = '/advisories/agenda/';

async function consultarGestion(consulta = '') {
  const [lista, parametros] = await Promise.all([
    peticionTodas<CitaGestionBackend, CitaGestionBackend>(
      `${RUTA_GESTION}${consulta}`,
      (cita) => cita,
    ),
    obtenerParametros(),
  ]);
  return lista.map((cita) => {
    idsCita.set(String(cita.request_id), cita.id);
    return citaGestionDesdeBackend(cita, parametros.duracionAsesoriaMinutos);
  });
}

export async function obtenerFacilitadores(): Promise<Usuario[]> {
  if (!usaApi('asesorias')) return USUARIOS_DIRECTORIO.filter((u) => tienePermiso(u, 'asesorias'));
  const lista = await peticionTodas<UsuarioBackend, UsuarioBackend>(
    '/users/?role=facilitador',
    (usuario) => usuario,
  );
  const facilitadores = lista
    .filter((usuario) => usuario.is_active !== false)
    .map(usuarioDirectorioDesdeBackend);
  const sesion = useSesion.getState().usuario;
  if (
    sesion &&
    tienePermiso(sesion, 'asesorias') &&
    !facilitadores.some((u) => u.id === sesion.id)
  ) {
    facilitadores.unshift(sesion);
  }
  return facilitadores;
}

async function idGestion(id: string) {
  if (!idsCita.has(id)) await consultarGestion();
  const encontrado = idsCita.get(id);
  if (encontrado === undefined) throw new ErrorApi(404, 'La asesoría no existe.');
  return encontrado;
}

async function decidirCitaBackend(idBackend: number, accion: string, datos: object) {
  const { duracionAsesoriaMinutos } = await obtenerParametros();
  const cita = await peticion<CitaGestionBackend>(`${RUTA_GESTION}${idBackend}/${accion}/`, {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return citaGestionDesdeBackend(cita, duracionAsesoriaMinutos);
}

/** Quien pide, para armar la cita: el usuario de la sesión. */
function solicitanteDeSesion() {
  const usuario = useSesion.getState().usuario;
  return { id: usuario?.id ?? '', nombre: usuario?.nombre ?? '' };
}

/** Traduce las citas del Backend y recuerda el id de cada una. */
async function citasDesdeBackend(lista: CitaBackend[]): Promise<Cita[]> {
  const { duracionAsesoriaMinutos } = await obtenerParametros();
  return lista.map((cita) => {
    idsCita.set(String(cita.request_id), cita.id);
    return citaDesdeBackend(cita, solicitanteDeSesion(), duracionAsesoriaMinutos);
  });
}

/** Mis citas del Backend, de la más reciente a la más antigua. */
async function misCitasBackend(): Promise<Cita[]> {
  return citasDesdeBackend(
    await peticionTodas<CitaBackend, CitaBackend>('/advisories/appointments/', (cita) => cita),
  );
}

/** El id de la cita en el Backend; si no se conoce todavía, vuelve a pedir mis citas. */
async function idEnBackend(id: string): Promise<number> {
  if (!idsCita.has(id)) await misCitasBackend();
  const encontrado = idsCita.get(id);
  if (encontrado == null) throw new ErrorApi(404, 'La asesoría no existe.');
  return encontrado;
}

/**
 * Los temas: para quien administra asesorías, todos (también los inactivos); para los demás,
 * los activos, que es lo que el Backend les muestra.
 */
async function temasBackend(): Promise<TemaAsesoria[]> {
  if (tienePermiso(useSesion.getState().usuario, 'asesorias')) {
    try {
      return await peticionTodas<TemaBackend, TemaAsesoria>(
        '/advisories/manage/topics/',
        temaDesdeBackend,
      );
    } catch (error) {
      if (!(error instanceof ErrorApi && (error.estado === 401 || error.estado === 403))) {
        throw error;
      }
    }
  }
  return (await peticion<TemaBackend[]>('/advisories/topics/')).map(temaDesdeBackend);
}

/** Todos los temas, también los inactivos, para la administración (HU-13). */
export function obtenerTemas(): Promise<TemaAsesoria[]> {
  if (usaApi('asesorias')) return temasBackend();
  return simularRed(temas.map((tema) => ({ ...tema })));
}

export async function guardarTema(datos: DatosTema): Promise<TemaAsesoria> {
  if (usaApi('asesorias')) {
    const ruta = datos.id
      ? `/advisories/manage/topics/${encodeURIComponent(datos.id)}/`
      : '/advisories/manage/topics/';
    return temaDesdeBackend(
      await peticion<TemaBackend>(ruta, {
        method: datos.id ? 'PATCH' : 'POST',
        body: JSON.stringify(temaHaciaBackend(datos)),
      }),
    );
  }
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

/** Todas las jornadas, para la administración (HU-13). */
export function obtenerJornadas(): Promise<Jornada[]> {
  if (USAR_MOCKS) {
    return simularRed(jornadas.map((jornada) => ({ ...jornada })));
  }
  // La administración de temas también consulta jornadas, aunque ya no formen parte de la API.
  return Promise.resolve([]);
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
    const anteriores = franjas.filter((franja) => franja.jornadaId === id);
    const cuposAnteriores = jornadas.find((actual) => actual.id === id)?.cupos ?? jornada.cupos;
    const nuevas = conservarFranjas(
      generarFranjas(jornada, parametros),
      anteriores,
      cuposAnteriores,
    );

    // Reemplaza las franjas de esta jornada sin perder las citas ya agendadas.
    franjas = [...franjas.filter((franja) => franja.jornadaId !== id), ...nuevas];

    if (datos.id) {
      jornadas = jornadas.map((actual) => (actual.id === datos.id ? jornada : actual));
    } else {
      jornadas = [...jornadas, jornada];
    }

    return simularRed({ jornada: { ...jornada }, franjasGeneradas: nuevas.length });
  }
  throw new ErrorApi(400, 'Las asesorías conectadas se solicitan por fecha y hora, sin jornadas.');
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
/**
 * Ajusta los cupos de una franja. Desde la versión 1.1 la cita puede no tener franja (#248),
 * y entonces no hay cupo que ajustar.
 */
function ajustarCupo(franjaId: string | undefined, cambio: number) {
  if (!franjaId) return;
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
  // #278: una cita pendiente se cancela o reprograma en cualquier momento; una aprobada, hasta
  // el plazo de `horasMinimasCancelacion`. Es la regla del Backend (`cancel-min-hours`).
  if (
    cita.estado === 'aprobada' &&
    !cumpleAnticipacion(cita.fecha, cita.horaInicio, parametros.horasMinimasCancelacion)
  ) {
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
 *
 * @deprecated Desde la versión 1.1 las asesorías no tienen franjas (#248). Se conserva para no
 * romper las pantallas que aún la usan.
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
  return [];
}

/**
 * Agenda una cita en una franja y la deja pendiente de aprobación (CA1): aparta el cupo, pero
 * no queda aprobada hasta que el facilitador o la administración la decidan. Si la franja se
 * llenó, la rechaza (CA2).
 *
 * @deprecated Desde la versión 1.1 las asesorías no van por jornadas: usa `solicitarCita()`,
 * que pide fecha y hora sin franja (#248). Se conserva para no romper lo que ya lo usa.
 */
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
      estado: 'pendiente',
    };
    citas = [...citas, cita];
    ajustarCupo(franjaId, -1);
    crearNotificacion({
      usuarioId: usuario.id,
      solicitudId: cita.id,
      titulo: 'Solicitud de asesoría recibida',
      mensaje: `Recibimos tu solicitud de ${cita.tema} para el ${fechaLegible(cita.fecha)} a las ${cita.horaInicio}. Te avisamos cuando la aprueben.`,
    });
    registrarEvento(
      'cita',
      cita.id,
      'pendiente',
      usuario.nombre,
      'Solicitud de asesoría recibida.',
    );
    // HU-25: agendar deja su registro de uso.
    registrarUso({
      id: `uso-cita-${cita.id}`,
      servicio: 'asesorias',
      finalidad: cita.tema,
      tematica: cita.tema,
      fecha: cita.fecha,
      modalidad: cita.modalidad,
      estado: 'pendiente',
      ...datosDeSolicitante(cita.solicitanteId),
    });
    return simularRed({ ...cita });
  }
  throw new ErrorApi(400, 'Solicita la asesoría indicando fecha y hora.');
}

// ── Versión 1.1: asesorías sin jornadas (#248) ────────────────

/**
 * Cita que la persona pide con fecha y hora, sin franja ni facilitador: la biblioteca la
 * confirma y asigna quién la atiende. Es lo que pide la bibliotecóloga desde el 15 de
 * noviembre de 2026.
 */
export async function solicitarCita(usuario: Usuario, nueva: NuevaSolicitudCita): Promise<Cita> {
  if (usaApi('asesorias')) {
    // Quien pide sale del token; el Backend valida el día hábil, la anticipación y el grupo.
    const creada = await peticion<CitaBackend>('/advisories/appointments/', {
      method: 'POST',
      body: JSON.stringify(citaHaciaBackend(nueva)),
    });
    return (await citasDesdeBackend([creada]))[0];
  }

  const tema = temas.find((t) => t.id === nueva.temaId);
  if (!tema?.activo) {
    throw new ErrorApi(400, 'Ese tema de asesoría ya no se ofrece.');
  }
  if (!esFechaValida(nueva.fecha) || !esHoraValida(nueva.hora)) {
    throw new ErrorApi(400, 'Revisa la fecha y la hora de la asesoría.');
  }
  const parametros = await obtenerParametros();

  const noHabil = motivoNoDisponible(nueva.fecha, parametros);
  if (noHabil) {
    throw new ErrorApi(400, `Ese día la biblioteca no atiende: ${noHabil}.`);
  }

  const inicio = aMinutos(nueva.hora);
  const fin = inicio + parametros.duracionAsesoriaMinutos;
  if (
    !horariosDeFecha(nueva.fecha, parametros).some(
      (h) => inicio >= aMinutos(h.abre) && fin <= aMinutos(h.cierra),
    )
  ) {
    throw new ErrorApi(
      400,
      'Elige una hora que permita completar la asesoría dentro de una franja de atención.',
    );
  }
  if (!cumpleAnticipacion(nueva.fecha, nueva.hora, parametros.horasMinimasSolicitud)) {
    throw new ErrorApi(
      400,
      `Las asesorías se piden con ${parametros.horasMinimasSolicitud} horas de anticipación.`,
    );
  }

  const personas = Number(nueva.personas ?? 0);
  if (!Number.isInteger(personas) || personas < 1) {
    throw new ErrorApi(400, 'Indica cuántas personas asisten: al menos una.');
  }
  // #278: el grupo de una asesoría tiene un tope (el Backend, `advisory-max-group`). Más gente
  // es una capacitación, que es otro servicio.
  if (personas > parametros.maximoPersonasAsesoria) {
    throw new ErrorApi(
      400,
      `Una asesoría es para ${parametros.maximoPersonasAsesoria} personas como máximo. Para un grupo mayor, solicita una capacitación.`,
    );
  }
  // #278: `participantes` son los **otros** integrantes (personas − 1); quien pide ya va en
  // `datosSolicitante`.
  const participantes = (nueva.participantes ?? []).map((nombre) => nombre.trim()).filter(Boolean);
  if (participantes.length !== personas - 1) {
    throw new ErrorApi(
      400,
      personas === 1
        ? 'Si vienes solo, no escribas nombres de otras personas.'
        : 'Escribe el nombre de cada una de las otras personas que asisten.',
    );
  }

  const necesidad = nueva.necesidad?.trim();
  if (!necesidad) {
    throw new ErrorApi(400, 'Cuéntanos brevemente qué necesitas.');
  }

  if (nueva.modalidad === 'presencial' && !nueva.datosSolicitante?.nombreCompleto?.trim()) {
    throw new ErrorApi(400, 'Escribe el nombre completo de quien pide la asesoría.');
  }

  const repetida = citas.some(
    (cita) =>
      cita.solicitanteId === usuario.id &&
      cita.fecha === nueva.fecha &&
      cita.horaInicio === nueva.hora &&
      ESTADOS_ACTIVOS.includes(cita.estado),
  );
  if (repetida) {
    throw new ErrorApi(400, 'Ya tienes una asesoría a esa hora.');
  }

  const cita: Cita = {
    id: `cit-${Date.now()}`,
    temaId: tema.id,
    tema: tema.nombre,
    solicitanteId: usuario.id,
    solicitante: usuario.nombre,
    fecha: nueva.fecha,
    horaInicio: nueva.hora,
    horaFin: aHora(fin),
    necesidad,
    modalidad: nueva.modalidad,
    estado: 'pendiente',
    datosSolicitante: nueva.datosSolicitante,
    personas,
    participantes,
    asignatura: nueva.asignatura?.trim() || undefined,
    novedades: nueva.novedades?.trim() || undefined,
    terminosAceptados: nueva.terminosAceptados,
  };
  citas = [...citas, cita];

  crearNotificacion({
    usuarioId: usuario.id,
    solicitudId: cita.id,
    titulo: 'Solicitud de asesoría recibida',
    mensaje: `Recibimos tu solicitud de ${cita.tema} para el ${fechaLegible(cita.fecha)} a las ${cita.horaInicio}. Te avisamos cuando la aprueben.`,
  });
  registrarEvento('cita', cita.id, 'pendiente', usuario.nombre, 'Solicitud de asesoría recibida.');
  registrarUso({
    id: `uso-cita-${cita.id}`,
    servicio: 'asesorias',
    finalidad: cita.tema,
    tematica: cita.tema,
    fecha: cita.fecha,
    modalidad: cita.modalidad,
    estado: 'pendiente',
    ...datosDeSolicitante(cita.solicitanteId),
  });

  return simularRed({ ...cita });
}

/** Lo que puede cambiar el personal al aprobar una cita (#248). */
export type AprobacionCita = {
  /** Quién la atiende. Obligatorio: la cita nace sin facilitador. */
  facilitadorId: string;
  /** Si el personal cambia el día, aquí va el nuevo; el pedido queda en `fechaSolicitada`. */
  fecha?: string;
  hora?: string;
  /** Cuando la cita es virtual es obligatorio: es cómo entra la persona. */
  enlaceVirtual?: string;
};

/**
 * Aprueba una cita pendiente asignándole facilitador (CA2 de #248).
 * - Si cambia la fecha o la hora, las originales quedan en `fechaSolicitada`/`horaSolicitada`.
 * - Una cita virtual no se aprueba sin enlace (CA3).
 * - Un facilitador solo puede asignarse a sí mismo; la administración, a cualquiera.
 */
export async function aprobarCitaConDatos(
  usuario: Usuario,
  id: string,
  aprobacion: AprobacionCita,
): Promise<Cita> {
  if (usaApi('asesorias')) {
    const idBackend = await idGestion(id);
    const cita =
      aprobacion.fecha && aprobacion.hora
        ? undefined
        : await peticion<CitaGestionBackend>(`${RUTA_GESTION}${idBackend}/`);
    return decidirCitaBackend(idBackend, 'approve', {
      scheduled_date: aprobacion.fecha ?? cita?.desired_date,
      start_time: aprobacion.hora ?? cita?.desired_time,
      facilitator: aprobacion.facilitadorId || undefined,
      virtual_link: aprobacion.enlaceVirtual?.trim(),
    });
  }

  const cita = citaDecidible(usuario, id);
  const esAdministracion =
    tienePermiso(usuario, 'asesorias') && usuario.rolesPersonal.includes('administrador');
  if (aprobacion.facilitadorId !== usuario.id && !esAdministracion) {
    throw new ErrorApi(403, 'Solo puedes asignarte a ti mismo como facilitador.');
  }
  const facilitador = USUARIOS_DIRECTORIO.find((u) => u.id === aprobacion.facilitadorId);
  if (!facilitador) {
    throw new ErrorApi(404, 'Ese facilitador no existe.');
  }

  const fecha = aprobacion.fecha ?? cita.fecha;
  const hora = aprobacion.hora ?? cita.horaInicio;
  if (!esFechaValida(fecha) || !esHoraValida(hora)) {
    throw new ErrorApi(400, 'Revisa la fecha y la hora de la cita.');
  }

  // El día hábil y la anticipación solo se exigen cuando el personal **cambia** la fecha o la
  // hora. La fecha pedida ya pasó esas dos reglas en `solicitarCita()`; volver a exigirlas al
  // aprobar rechazaría citas pedidas con tiempo y aprobadas a menos de 72 h (#248, revisión).
  const cambio = fecha !== cita.fecha || hora !== cita.horaInicio;
  const parametros = await obtenerParametros();
  if (cambio) {
    const noHabil = motivoNoDisponible(fecha, parametros);
    if (noHabil) {
      throw new ErrorApi(400, `Ese día la biblioteca no atiende: ${noHabil}.`);
    }
    if (!cumpleAnticipacion(fecha, hora, parametros.horasMinimasSolicitud)) {
      throw new ErrorApi(
        400,
        `La cita necesita ${parametros.horasMinimasSolicitud} horas de anticipación.`,
      );
    }
  }

  // #278: un facilitador no puede tener dos asesorías aprobadas a la misma hora.
  const finNueva = aHora(aMinutos(hora) + parametros.duracionAsesoriaMinutos);
  const choque = citas.find(
    (otra) =>
      otra.id !== cita.id &&
      otra.estado === 'aprobada' &&
      otra.facilitadorId === facilitador.id &&
      otra.fecha === fecha &&
      aMinutos(otra.horaInicio) < aMinutos(finNueva) &&
      aMinutos(otra.horaFin) > aMinutos(hora),
  );
  if (choque) {
    throw new ErrorApi(
      400,
      `${facilitador.nombre} ya tiene la asesoría «${choque.tema}» de ${choque.horaInicio} a ${choque.horaFin} ese día.`,
    );
  }

  const enlace = aprobacion.enlaceVirtual?.trim();
  if (cita.modalidad === 'virtual' && !enlace) {
    throw new ErrorApi(400, 'Una asesoría virtual necesita el enlace para que la persona entre.');
  }
  const aprobada: Cita = {
    ...cita,
    estado: 'aprobada',
    motivo: undefined,
    facilitadorId: facilitador.id,
    facilitador: facilitador.nombre,
    fecha,
    horaInicio: hora,
    horaFin: finNueva,
    fechaSolicitada: cambio ? (cita.fechaSolicitada ?? cita.fecha) : cita.fechaSolicitada,
    horaSolicitada: cambio ? (cita.horaSolicitada ?? cita.horaInicio) : cita.horaSolicitada,
    enlaceVirtual: cita.modalidad === 'virtual' ? enlace : cita.enlaceVirtual,
  };
  citas = citas.map((actual) => (actual.id === id ? aprobada : actual));

  const cuando = `${fechaLegible(aprobada.fecha)} a las ${aprobada.horaInicio}`;
  crearNotificacion({
    usuarioId: cita.solicitanteId,
    solicitudId: cita.id,
    titulo: 'Asesoría aprobada',
    mensaje: aprobada.enlaceVirtual
      ? `Tu asesoría de ${cita.tema} quedó para el ${cuando}. Entra con este enlace: ${aprobada.enlaceVirtual}`
      : `Tu asesoría de ${cita.tema} quedó para el ${cuando} con ${aprobada.facilitador}.`,
  });
  registrarEvento(
    'cita',
    cita.id,
    'aprobada',
    usuario.nombre,
    cambio
      ? `Aprobada para el ${cuando} (la persona pidió el ${fechaLegible(cita.fechaSolicitada ?? cita.fecha)}).`
      : 'Asesoría aprobada.',
  );
  registrarUso({
    id: `uso-cita-${cita.id}`,
    servicio: 'asesorias',
    finalidad: cita.tema,
    tematica: cita.tema,
    // #307: la primera respuesta del personal cuenta para el tiempo de respuesta.
    respondida: true,
    fecha: aprobada.fecha,
    modalidad: aprobada.modalidad,
    estado: 'pendiente',
    ...datosDeSolicitante(cita.solicitanteId),
  });

  return simularRed({ ...aprobada });
}

/**
 * Reprogramar en la versión 1.1 es enviar una **solicitud nueva** (CA4 de #248): la anterior
 * queda cancelada con su motivo y la nueva nace pendiente, con `reprogramaDe` apuntando a ella.
 * Respeta el plazo de cancelación sobre la cita anterior.
 */
export async function reprogramarSolicitud(
  usuario: Usuario,
  id: string,
  nueva: NuevaSolicitudCita,
): Promise<Cita> {
  if (usaApi('asesorias')) {
    // El Backend cancela la cita y crea otra pendiente con la nueva fecha y hora.
    const nuevaCita = await peticion<CitaBackend>(
      `/advisories/appointments/${await idEnBackend(id)}/reschedule/`,
      {
        method: 'POST',
        body: JSON.stringify({ desired_date: nueva.fecha, desired_time: nueva.hora }),
      },
    );
    return (await citasDesdeBackend([nuevaCita]))[0];
  }

  const parametros = await obtenerParametros();
  const anterior = citaModificable(usuario.id, id, parametros, 'reprogramar');

  const creada = await solicitarCita(usuario, nueva);
  const cancelada: Cita = {
    ...anterior,
    estado: 'cancelada',
    motivo: 'Reprogramada por la persona',
  };
  citas = citas.map((cita) =>
    cita.id === anterior.id
      ? cancelada
      : cita.id === creada.id
        ? { ...creada, reprogramaDe: anterior.id }
        : cita,
  );

  // Rastro completo: la anterior se cancela con su notificación, como cualquier cancelación.
  crearNotificacion({
    usuarioId: anterior.solicitanteId,
    solicitudId: anterior.id,
    titulo: 'Asesoría reprogramada',
    mensaje: `Tu asesoría de ${anterior.tema} del ${fechaLegible(anterior.fecha)} a las ${anterior.horaInicio} quedó cancelada porque pediste otra fecha. La nueva solicitud está pendiente de aprobación.`,
  });
  registrarEvento('cita', anterior.id, 'cancelada', usuario.nombre, 'Reprogramada por la persona.');
  registrarUso({
    id: `uso-cita-${anterior.id}`,
    servicio: 'asesorias',
    finalidad: anterior.tema,
    fecha: anterior.fecha,
    modalidad: anterior.modalidad,
    estado: 'cancelada',
    ...datosDeSolicitante(anterior.solicitanteId),
  });

  return simularRed({ ...creada, reprogramaDe: anterior.id });
}

/** Citas del usuario de la sesión, por fecha (HU-14 y HU-15). */
export async function obtenerMisCitas(usuarioId: string): Promise<Cita[]> {
  if (usaApi('asesorias')) return ordenarPorFecha(await misCitasBackend());
  const mias = citas.filter((cita) => cita.solicitanteId === usuarioId);
  return simularRed(ordenarPorFecha(mias).map((cita) => ({ ...cita })));
}

/** Cancela una cita dentro del plazo y libera el cupo (CA3). */
export async function cancelarCita(usuario: Usuario, id: string): Promise<Cita> {
  if (usaApi('asesorias')) {
    // Pendiente se retira cuando sea; aprobada, hasta `cancel-min-hours` antes (409 si no).
    const cancelada = await peticion<CitaBackend>(
      `/advisories/appointments/${await idEnBackend(id)}/cancel/`,
      { method: 'POST', body: JSON.stringify({ reason: 'Cancelada por el usuario.' }) },
    );
    return { ...(await citasDesdeBackend([cancelada]))[0], motivo: 'Cancelada por el usuario.' };
  }
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
  registrarEvento('cita', cita.id, 'cancelada', usuario.nombre, cancelada.motivo);
  // HU-25: cancelar también deja rastro.
  registrarUso({
    id: `uso-cita-${cita.id}`,
    servicio: 'asesorias',
    finalidad: cita.tema,
    tematica: cita.tema,
    fecha: cita.fecha,
    modalidad: cita.modalidad,
    estado: 'cancelada',
    ...datosDeSolicitante(cita.solicitanteId),
  });
  return simularRed({ ...cancelada });
}

/**
 * Pasa una cita a otra franja del mismo tema, dentro del plazo de cancelación (CA3).
 * Libera el cupo de la franja anterior y ocupa uno de la nueva.
 *
 * @deprecated Desde la versión 1.1 reprogramar es enviar una **solicitud nueva** pendiente de
 * aprobación: usa `reprogramarSolicitud()` (#248).
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
    // Reprogramar vuelve a dejar la cita pendiente: la tiene que aprobar otra vez el personal.
    const actualizada: Cita = { ...cita, ...datos, estado: 'pendiente', motivo: undefined };
    citas = citas.map((c) => (c.id === id ? actualizada : c));
    ajustarCupo(cita.franjaId, 1);
    ajustarCupo(nuevaFranjaId, -1);
    crearNotificacion({
      usuarioId: usuario.id,
      solicitudId: cita.id,
      titulo: 'Asesoría reprogramada',
      mensaje: `Tu solicitud de ${actualizada.tema} quedó para el ${fechaLegible(actualizada.fecha)} a las ${actualizada.horaInicio}, pendiente de aprobación.`,
    });
    registrarEvento(
      'cita',
      actualizada.id,
      'pendiente',
      usuario.nombre,
      `Reprogramada para el ${fechaLegible(actualizada.fecha)} a las ${actualizada.horaInicio}.`,
    );
    // HU-25: se actualiza el mismo registro de la cita (no se duplica).
    registrarUso({
      id: `uso-cita-${actualizada.id}`,
      servicio: 'asesorias',
      finalidad: actualizada.tema,
      fecha: actualizada.fecha,
      modalidad: actualizada.modalidad,
      estado: 'pendiente',
      ...datosDeSolicitante(actualizada.solicitanteId),
    });
    return simularRed({ ...actualizada });
  }
  throw new ErrorApi(400, 'Reprograma la asesoría indicando la nueva fecha y hora.');
}

// ── HU-14 (1.1): aprobar o rechazar una cita pendiente ────────

/**
 * Quién decide una cita:
 * - la administración, siempre (ya ve todas las citas);
 * - el facilitador que la atiende, cuando ya está asignado;
 * - **cualquier facilitador, si la cita nació sin asignar** (#248): alguien tiene que tomarla,
 *   y es justo el caso normal de la versión 1.1, donde el facilitador se asigna al aprobar.
 * No hace falta un rol nuevo: basta el permiso de asesorías.
 */
function puedeDecidirCita(usuario: Usuario, cita: Cita): boolean {
  if (usuario.rolesPersonal.includes('administrador')) return true;
  if (cita.facilitadorId != null) return cita.facilitadorId === usuario.id;
  return tienePermiso(usuario, 'asesorias');
}

/**
 * Cita pendiente que el usuario puede aprobar o rechazar. El permiso se comprueba antes que
 * el estado: quien no puede decidir recibe 403 aunque la cita ya no esté pendiente, así no
 * averigua el estado de una cita ajena.
 */
function citaDecidible(usuario: Usuario, id: string): Cita {
  const cita = citas.find((actual) => actual.id === id);
  if (!cita) {
    throw new ErrorApi(404, 'La cita no existe.');
  }
  if (!puedeDecidirCita(usuario, cita)) {
    throw new ErrorApi(403, 'Solo el facilitador de la cita o la administración pueden decidirla.');
  }
  if (cita.estado !== 'pendiente') {
    throw new ErrorApi(400, 'Esta cita ya no está pendiente de aprobación.');
  }
  return cita;
}

/**
 * Aprueba una cita pendiente (CA2). Avisa a la persona y deja el rastro de siempre:
 * notificación, evento del historial y registro de uso.
 */
export async function aprobarCita(usuario: Usuario, id: string): Promise<Cita> {
  if (usaApi('asesorias')) return aprobarCitaConDatos(usuario, id, { facilitadorId: usuario.id });
  const cita = citaDecidible(usuario, id);
  const aprobada: Cita = { ...cita, estado: 'aprobada', motivo: undefined };
  citas = citas.map((actual) => (actual.id === id ? aprobada : actual));
  crearNotificacion({
    usuarioId: cita.solicitanteId,
    solicitudId: cita.id,
    titulo: 'Asesoría aprobada',
    mensaje: `Tu asesoría de ${cita.tema} del ${fechaLegible(cita.fecha)} a las ${cita.horaInicio} quedó aprobada.`,
  });
  registrarEvento('cita', cita.id, 'aprobada', usuario.nombre, 'Asesoría aprobada.');
  registrarUso({
    id: `uso-cita-${cita.id}`,
    servicio: 'asesorias',
    finalidad: cita.tema,
    tematica: cita.tema,
    // #307: la primera respuesta del personal cuenta para el tiempo de respuesta.
    respondida: true,
    fecha: cita.fecha,
    modalidad: cita.modalidad,
    estado: 'pendiente',
    ...datosDeSolicitante(cita.solicitanteId),
  });
  return simularRed({ ...aprobada });
}

/**
 * Rechaza una cita pendiente con un motivo obligatorio (CA3). El cupo vuelve a quedar libre
 * y la persona ve el motivo en el detalle.
 */
export async function rechazarCita(usuario: Usuario, id: string, motivo: string): Promise<Cita> {
  if (usaApi('asesorias')) {
    return decidirCitaBackend(await idGestion(id), 'reject', { reason: motivo.trim() });
  }
  // Primero quién puede decidir y si sigue pendiente: un rechazo sin permiso es 403 aunque
  // el motivo falte, para no revelar el estado de una cita ajena.
  const cita = citaDecidible(usuario, id);
  const texto = motivo?.trim() ?? '';
  if (!texto) {
    throw new ErrorApi(400, 'El motivo del rechazo es obligatorio.');
  }
  if (texto.length > 200) {
    throw new ErrorApi(400, 'Máximo 200 caracteres.');
  }
  const rechazada: Cita = { ...cita, estado: 'rechazada', motivo: texto };
  citas = citas.map((actual) => (actual.id === id ? rechazada : actual));
  ajustarCupo(cita.franjaId, 1);
  crearNotificacion({
    usuarioId: cita.solicitanteId,
    solicitudId: cita.id,
    titulo: 'Asesoría rechazada',
    mensaje: `Tu asesoría de ${cita.tema} del ${fechaLegible(cita.fecha)} a las ${cita.horaInicio} no se pudo agendar: ${texto}`,
  });
  registrarEvento('cita', cita.id, 'rechazada', usuario.nombre, texto);
  registrarUso({
    id: `uso-cita-${cita.id}`,
    servicio: 'asesorias',
    finalidad: cita.tema,
    tematica: cita.tema,
    // #307: la primera respuesta del personal cuenta para el tiempo de respuesta.
    respondida: true,
    fecha: cita.fecha,
    modalidad: cita.modalidad,
    estado: 'cancelada',
    ...datosDeSolicitante(cita.solicitanteId),
  });
  return simularRed({ ...rechazada });
}

// ── HU-15: agenda del facilitador ──────────────────────────────

/** Cita de la agenda con los datos del solicitante (CA2). */
export type CitaAgenda = Cita & {
  /** Tipo de usuario del solicitante (CA2). */
  solicitanteTipo?: TipoUsuario;
  /** Programa o dependencia del solicitante (CA2); vacío si no está informado. */
  solicitantePrograma?: string;
};

export async function cancelarCitaPersonal(id: string, motivo: string): Promise<Cita> {
  const reason = motivo.trim();
  if (!reason) throw new ErrorApi(400, 'Indica el motivo de la cancelación.');
  if (!usaApi('asesorias')) {
    const usuario = useSesion.getState().usuario;
    if (!usuario) throw new ErrorApi(401, 'Inicia sesión para cancelar la asesoría.');
    const cita = citas.find((actual) => actual.id === id);
    if (!cita) throw new ErrorApi(404, 'La cita no existe.');
    if (!puedeDecidirCita(usuario, cita)) throw new ErrorApi(403, 'No puedes cancelar esta cita.');
    if (cita.estado !== 'pendiente' && cita.estado !== 'aprobada') {
      throw new ErrorApi(400, 'Solo puedes cancelar una cita pendiente o aprobada.');
    }
    const cancelada: Cita = { ...cita, estado: 'cancelada', motivo: reason };
    citas = citas.map((actual) => (actual.id === id ? cancelada : actual));
    ajustarCupo(cita.franjaId, 1);
    crearNotificacion({
      usuarioId: cita.solicitanteId,
      solicitudId: id,
      titulo: 'Asesoría cancelada',
      mensaje: reason,
    });
    registrarEvento('cita', id, 'cancelada', usuario.nombre, reason);
    registrarUso({
      id: `uso-cita-${id}`,
      servicio: 'asesorias',
      finalidad: cita.tema,
      tematica: cita.tema,
      fecha: cita.fecha,
      modalidad: cita.modalidad,
      estado: 'cancelada',
      respondida: true,
      ...datosDeSolicitante(cita.solicitanteId),
    });
    return simularRed({ ...cancelada });
  }
  return {
    ...(await decidirCitaBackend(await idGestion(id), 'cancel', { reason })),
    motivo: reason,
  };
}

async function agendaBackend(facilitadorId: string, desde: string, hasta: string) {
  const rango = `from=${desde}&to=${hasta}`;
  if (facilitadorId === 'todas') {
    const lista = await consultarGestion(`?${rango}`);
    const sesion = useSesion.getState().usuario;
    return ordenarPorFecha(
      lista.map((cita) => ({
        ...cita,
        ...(!cita.facilitadorId &&
        sesion &&
        (cita.facilitador === sesion.nombre || cita.facilitador === sesion.correo)
          ? { facilitadorId: sesion.id }
          : {}),
      })),
    );
  }

  const fechas: string[] = [];
  const fecha = new Date(`${desde}T00:00:00Z`);
  while (fecha.toISOString().slice(0, 10) <= hasta) {
    fechas.push(fecha.toISOString().slice(0, 10));
    fecha.setUTCDate(fecha.getUTCDate() + (fecha.getUTCDay() === 0 ? 1 : 8 - fecha.getUTCDay()));
  }
  const [paginas, pendientes, parametros] = await Promise.all([
    Promise.all(
      fechas.map((date) =>
        peticion<{ appointments: { id: number; date: string }[] }>(
          `${RUTA_AGENDA}?view=week&date=${date}`,
        ),
      ),
    ),
    consultarGestion(`?${rango}&status=PENDING`),
    obtenerParametros(),
  ]);
  const resumenes = paginas
    .flatMap(({ appointments }) => appointments)
    .filter((cita) => cita.date >= desde && cita.date <= hasta);
  const citas = await Promise.all(
    resumenes.map(async ({ id }) => {
      const detalle = await peticion<DetalleAgendaBackend>(`${RUTA_AGENDA}appointments/${id}/`);
      idsCita.set(String(detalle.request_id), detalle.id);
      return {
        ...citaAgendaDesdeBackend(detalle, parametros.duracionAsesoriaMinutos),
        facilitadorId,
      };
    }),
  );
  return ordenarPorFecha([...pendientes, ...citas]);
}

async function registrarAgendaBackend(
  citaId: string,
  facilitadorId: string,
  attended: boolean,
  result?: string,
) {
  const id = await idGestion(citaId);
  const { duracionAsesoriaMinutos } = await obtenerParametros();
  const detalle = await peticion<DetalleAgendaBackend>(`${RUTA_AGENDA}appointments/${id}/record/`, {
    method: 'POST',
    body: JSON.stringify({ attended, result }),
  });
  return { ...citaAgendaDesdeBackend(detalle, duracionAsesoriaMinutos), facilitadorId };
}

/** Copia de la cita con el tipo y el programa del solicitante, si está en el directorio. */
function aCitaAgenda(cita: Cita): CitaAgenda {
  const solicitante = USUARIOS_DIRECTORIO.find((usuario) => usuario.id === cita.solicitanteId);
  return {
    ...cita,
    solicitanteTipo: solicitante?.tipo,
    solicitantePrograma: solicitante?.programa,
  };
}

/**
 * Cita activa del facilitador que ya terminó, para registrar lo que pasó. Solo una cita
 * aprobada se atiende: una pendiente todavía no se aprobó y una rechazada no se da.
 * Una cita de otro facilitador responde como si no existiera.
 */
function citaAtendible(usuarioId: string, citaId: string, accion: string): Cita {
  const cita = citas.find((c) => c.id === citaId && c.facilitadorId === usuarioId);
  if (!cita) {
    throw new ErrorApi(404, 'La cita no existe.');
  }
  if (cita.estado !== 'aprobada') {
    throw new ErrorApi(400, 'Esta cita ya no se puede atender.');
  }
  if (new Date(`${cita.fecha}T${cita.horaFin}:00`) > new Date()) {
    throw new ErrorApi(400, `Solo puedes registrar ${accion} cuando la cita haya terminado.`);
  }
  return cita;
}

/**
 * Citas de un facilitador, o de todos con 'todas' (administración), entre dos fechas
 * incluidas (HU-15). Trae todos los estados, por fecha y hora, con los datos del
 * solicitante (CA2). El alcance real lo aplica el Backend.
 */
export function obtenerAgenda(
  facilitadorId: string | 'todas',
  desde: string,
  hasta: string,
): Promise<CitaAgenda[]> {
  if (!esFechaValida(desde) || !esFechaValida(hasta)) {
    return Promise.reject(new ErrorApi(400, 'Revisa el rango de fechas.'));
  }
  if (usaApi('asesorias')) return agendaBackend(facilitadorId, desde, hasta);
  const lista = citas.filter(
    (cita) =>
      cita.fecha >= desde &&
      cita.fecha <= hasta &&
      (facilitadorId === 'todas' ||
        cita.facilitadorId === facilitadorId ||
        // Las pendientes sin asignar las ve todo el personal: alguien tiene que aprobarlas.
        (cita.facilitadorId == null && cita.estado === 'pendiente')),
  );
  return simularRed(ordenarPorFecha(lista).map(aCitaAgenda));
}

/** Registra el resultado de una cita que ya terminó: queda realizada y con asistencia. */
export async function registrarResultado(
  usuario: Usuario,
  citaId: string,
  resultado: string,
): Promise<CitaAgenda> {
  if (usaApi('asesorias'))
    return registrarAgendaBackend(citaId, usuario.id, true, resultado.trim());
  const cita = citaAtendible(usuario.id, citaId, 'el resultado');
  const texto = resultado?.trim() ?? '';
  if (!texto) {
    throw new ErrorApi(400, 'Escribe el resultado de la asesoría.');
  }
  if (texto.length > 300) {
    throw new ErrorApi(400, 'Máximo 300 caracteres.');
  }
  const actualizada: Cita = { ...cita, estado: 'realizada', asistio: true, resultado: texto };
  citas = citas.map((c) => (c.id === citaId ? actualizada : c));
  registrarEvento('cita', actualizada.id, 'realizada', usuario.nombre, texto);
  // HU-25: la asesoría realizada deja su registro de uso.
  registrarUso({
    id: `uso-cita-${actualizada.id}`,
    servicio: 'asesorias',
    finalidad: actualizada.tema,
    fecha: actualizada.fecha,
    modalidad: actualizada.modalidad,
    estado: 'completada',
    ...datosDeSolicitante(actualizada.solicitanteId),
  });
  // #254: invita a calificar. Solo aquí: una inasistencia no se califica. citaAtendible()
  // exige una cita aprobada, así que una ya realizada no vuelve a invitar.
  crearNotificacion({
    usuarioId: actualizada.solicitanteId,
    solicitudId: actualizada.id,
    titulo: '¿Cómo te pareció tu asesoría?',
    mensaje: MENSAJE_INVITACION_CALIFICAR,
  });
  return simularRed(aCitaAgenda(actualizada));
}

/**
 * Registra que la persona no asistió. No hay un estado propio: queda realizada con
 * `asistio: false`, y la pantalla muestra "No asistió".
 */
export async function registrarInasistencia(usuario: Usuario, citaId: string): Promise<CitaAgenda> {
  if (usaApi('asesorias')) return registrarAgendaBackend(citaId, usuario.id, false);
  const cita = citaAtendible(usuario.id, citaId, 'la inasistencia');
  const actualizada: Cita = { ...cita, estado: 'realizada', asistio: false, resultado: undefined };
  citas = citas.map((c) => (c.id === citaId ? actualizada : c));
  registrarEvento('cita', actualizada.id, 'realizada', usuario.nombre, 'No asistió.');
  // HU-25: la inasistencia cierra el registro de la cita como cancelada.
  registrarUso({
    id: `uso-cita-${actualizada.id}`,
    servicio: 'asesorias',
    finalidad: actualizada.tema,
    fecha: actualizada.fecha,
    modalidad: actualizada.modalidad,
    estado: 'cancelada',
    ...datosDeSolicitante(actualizada.solicitanteId),
  });
  return simularRed(aCitaAgenda(actualizada));
}

// ── Versión 1.1: calificación del servicio (#254) ─────────────────────────

/**
 * La persona califica su asesoría realizada, una sola vez (CA1): puntaje de 1 a 5 y comentario
 * opcional. 404 si no existe, 403 si no es suya y 400 si no está realizada (CA2), si no asistió
 * o si ya la calificó. Deja el evento en el historial (HU-08) y el puntaje en el mismo registro
 * de uso (HU-25) para el promedio de HU-26 (CA3).
 */
export async function calificarCita(
  usuario: Usuario,
  id: string,
  datos: DatosCalificacion,
): Promise<Cita> {
  if (usaApi('asesorias')) {
    // Una vez y cuando ya terminó; quien califica sale del token.
    const calificada = await peticion<CitaBackend>(
      `/advisories/appointments/${await idEnBackend(id)}/rate/`,
      {
        method: 'POST',
        body: JSON.stringify({ quality_rating: datos.puntaje, comment: datos.comentario ?? '' }),
      },
    );
    return (await citasDesdeBackend([calificada]))[0];
  }

  const cita = citas.find((actual) => actual.id === id);
  if (!cita) {
    throw new ErrorApi(404, 'La asesoría no existe.');
  }
  if (cita.solicitanteId !== usuario.id) {
    throw new ErrorApi(403, 'Solo quien pidió la asesoría puede calificarla.');
  }
  if (cita.estado !== 'realizada') {
    throw new ErrorApi(400, 'Solo puedes calificar una asesoría finalizada.');
  }
  if (cita.asistio === false) {
    throw new ErrorApi(400, 'No puedes calificar una asesoría a la que no asististe.');
  }
  if (cita.calificacion) {
    throw new ErrorApi(400, 'Ya calificaste esta asesoría.');
  }
  const problema = problemaCalificacion(datos);
  if (problema) {
    throw new ErrorApi(400, problema);
  }

  const calificacion = crearCalificacion(datos);
  const actualizada: Cita = { ...cita, calificacion };
  citas = citas.map((actual) => (actual.id === id ? actualizada : actual));
  registrarEvento('cita', id, 'realizada', usuario.nombre, notaCalificacion(calificacion.puntaje));
  registrarUso({
    id: `uso-cita-${id}`,
    servicio: 'asesorias',
    finalidad: actualizada.tema,
    fecha: actualizada.fecha,
    modalidad: actualizada.modalidad,
    estado: 'completada',
    calificacion: calificacion.puntaje,
    ...datosDeSolicitante(actualizada.solicitanteId),
  });
  return simularRed({ ...actualizada, calificacion: { ...calificacion } });
}
