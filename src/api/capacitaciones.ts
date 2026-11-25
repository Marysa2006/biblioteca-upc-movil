/**
 * Capacitaciones: líneas de formación (HU-09), solicitudes (HU-10) y, más adelante, su
 * gestión (HU-12).
 * Lista, crea y edita líneas y cambia su estado; avisa si una línea tiene solicitudes activas
 * antes de desactivarla (CA3). La comunidad solicita una capacitación sobre una línea activa.
 */
import type {
  DatosSolicitante,
  EstadoSolicitud,
  LineaFormacion,
  ModalidadCapacitacion,
  SolicitanteCapacitacion,
  SolicitudCapacitacion,
  Usuario,
} from '@/types';
import { sumarDias } from '@/utils/calendario';
import {
  crearCalificacion,
  MENSAJE_INVITACION_CALIFICAR,
  notaCalificacion,
  problemaCalificacion,
  type DatosCalificacion,
} from '@/utils/calificacion';
import {
  LARGO_MAXIMO_ASIGNATURA,
  LARGO_MAXIMO_NOVEDADES,
  MAXIMO_PARTICIPANTES,
  MENSAJE_MAXIMO_PARTICIPANTES,
  problemaNombresParticipantes,
} from '@/utils/capacitaciones';
import { esFechaValida, esHoraValida, hoyISO } from '@/utils/fechas';
import { esDiaHabil, motivoNoDisponible, sugerirFechaHabil } from '@/utils/parametros';
import { aDatosSolicitante, problemaSolicitante, valoresSolicitante } from '@/utils/solicitante';
import { ahoraFechaHora } from '@/utils/tablets';
import { aNombrePropio, normalizarTexto } from '@/utils/texto';

import { puedeCancelarSolicitud } from '@/utils/cancelacionSolicitud';
import { useSesion } from '@/store/sesion';
import { describirRoles, tienePermiso } from '@/utils/roles';

import {
  capacitacionDesdeBackend,
  capacitacionGestionDesdeBackend,
  capacitacionHaciaBackend,
  lineaDesdeBackend,
  lineaHaciaBackend,
  type CapacitacionBackend,
  type CapacitacionGestionBackend,
  type ResponsableBackend,
  type LineaBackend,
} from './backend/capacitaciones';
import { ErrorApi, peticion, peticionTodas, simularRed, usaApi } from './cliente';
import { datosDeSolicitante, registrarUso } from './estadisticas';
import { historialDePrueba, registrarEvento } from './historial';
import { historialDesdeBackend } from './backend/solicitudes';
import { crearNotificacion } from './notificaciones';
import { LINEAS_FORMACION, SOLICITUDES_CAPACITACION } from './mocks/capacitaciones';
import { USUARIOS_DIRECTORIO } from './mocks/usuarios';
import { obtenerParametros, obtenerPlazoCancelacion } from './parametros';

/** Copia de una solicitud para no exponer el almacén mutable. */
function copiarSolicitud(solicitud: SolicitudCapacitacion): SolicitudCapacitacion {
  return {
    ...solicitud,
    solicitante: { ...solicitud.solicitante },
    ...(solicitud.datosSolicitante ? { datosSolicitante: { ...solicitud.datosSolicitante } } : {}),
    ...(solicitud.nombresParticipantes
      ? { nombresParticipantes: [...solicitud.nombresParticipantes] }
      : {}),
  };
}

/** Copias mutables: con mocks, lo que se crea o edita se ve durante la sesión. */
let lineas: LineaFormacion[] = LINEAS_FORMACION.map((linea) => ({ ...linea }));
let solicitudes: SolicitudCapacitacion[] = SOLICITUDES_CAPACITACION.map(copiarSolicitud);

/** Datos del formulario de una línea; sin id crea y con id edita. */
export type DatosLinea = Omit<LineaFormacion, 'id'> & { id?: string };

/** Estados en los que una solicitud sigue activa y cuenta para la advertencia (CA3). */
const ESTADOS_ACTIVOS: readonly EstadoSolicitud[] = ['pendiente', 'aprobada', 'nueva_fecha'];

const LARGO_MAXIMO_NOMBRE = 80;
const LARGO_MAXIMO_DESCRIPCION = 300;

/** Validación de la línea: nombre y descripción obligatorios y nombre único (CA2). */
function errorDeLinea(datos: DatosLinea): ErrorApi | null {
  const nombre = datos.nombre?.trim() ?? '';
  if (!nombre) {
    return new ErrorApi(400, 'El nombre de la línea es obligatorio.');
  }
  if (nombre.length > LARGO_MAXIMO_NOMBRE) {
    return new ErrorApi(400, `El nombre no puede pasar de ${LARGO_MAXIMO_NOMBRE} caracteres.`);
  }
  const descripcion = datos.descripcion?.trim() ?? '';
  if (!descripcion) {
    return new ErrorApi(400, 'La descripción de la línea es obligatoria.');
  }
  if (descripcion.length > LARGO_MAXIMO_DESCRIPCION) {
    return new ErrorApi(
      400,
      `La descripción no puede pasar de ${LARGO_MAXIMO_DESCRIPCION} caracteres.`,
    );
  }
  // Sin distinguir mayúsculas ni tildes: "Normás APA" choca con "Normas APA" (CA2).
  const buscado = normalizarTexto(nombre);
  const repetida = lineas.find(
    (linea) => linea.id !== datos.id && normalizarTexto(linea.nombre) === buscado,
  );
  if (repetida) {
    return new ErrorApi(400, 'Ya existe una línea de formación con ese nombre.');
  }
  return null;
}

// ── Con la API (módulo `capacitaciones` de `usaApi()`) ────────────────────────────────────

const RUTA_LINEAS_GESTION = '/trainings/lines/manage/';

/** Quien pide, como lo guarda la solicitud: el usuario de la sesión. */
function solicitanteDeSesion(): SolicitanteCapacitacion {
  const usuario = useSesion.getState().usuario;
  return {
    id: usuario?.id ?? '',
    nombre: usuario?.nombre ?? '',
    tipo: usuario?.tipo ?? 'visitante',
    ...(usuario?.programa ? { programa: usuario.programa } : {}),
  };
}

/** Las líneas: todas para quien administra la formación; las activas para los demás. */
async function lineasBackend(): Promise<LineaFormacion[]> {
  if (tienePermiso(useSesion.getState().usuario, 'formacion')) {
    try {
      return await peticionTodas<LineaBackend, LineaFormacion>(
        RUTA_LINEAS_GESTION,
        lineaDesdeBackend,
      );
    } catch (error) {
      if (!(error instanceof ErrorApi && (error.estado === 401 || error.estado === 403))) {
        throw error;
      }
    }
  }
  return (await peticion<LineaBackend[]>('/trainings/lines/')).map(lineaDesdeBackend);
}

/** Crea (sin id) o edita una línea en el Backend. */
async function guardarLineaBackend(datos: DatosLinea, id?: string): Promise<LineaFormacion> {
  const ruta = id ? `${RUTA_LINEAS_GESTION}${encodeURIComponent(id)}/` : RUTA_LINEAS_GESTION;
  return lineaDesdeBackend(
    await peticion<LineaBackend>(ruta, {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(lineaHaciaBackend(datos)),
    }),
  );
}

/** Todas las líneas, también las inactivas, para la administración (HU-09). */
export function obtenerLineas(): Promise<LineaFormacion[]> {
  if (usaApi('capacitaciones')) return lineasBackend();
  return simularRed(lineas.map((linea) => ({ ...linea })));
}

/** Las líneas activas, para el formulario de solicitud de HU-10 (CA1). */
export async function lineasActivas(): Promise<LineaFormacion[]> {
  const todas = await obtenerLineas();
  return todas.filter((linea) => linea.activa);
}

export function crearLinea(datos: DatosLinea): Promise<LineaFormacion> {
  if (usaApi('capacitaciones')) return guardarLineaBackend(datos);
  const error = errorDeLinea(datos);
  if (error) {
    return Promise.reject(error);
  }
  const nueva: LineaFormacion = {
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim(),
    activa: datos.activa,
    id: `lin-${Date.now()}`,
  };
  lineas = [...lineas, nueva];
  return simularRed({ ...nueva });
}

export function editarLinea(id: string, datos: DatosLinea): Promise<LineaFormacion> {
  if (usaApi('capacitaciones')) return guardarLineaBackend(datos, id);
  if (!lineas.some((linea) => linea.id === id)) {
    return Promise.reject(new ErrorApi(404, 'La línea de formación no existe.'));
  }
  const error = errorDeLinea({ ...datos, id });
  if (error) {
    return Promise.reject(error);
  }
  const actualizada: LineaFormacion = {
    id,
    nombre: datos.nombre.trim(),
    descripcion: datos.descripcion.trim(),
    activa: datos.activa,
  };
  lineas = lineas.map((linea) => (linea.id === id ? actualizada : linea));
  return simularRed({ ...actualizada });
}

/**
 * Cuántas solicitudes activas (pendientes, aprobadas o con nueva fecha) tiene la línea.
 * La pantalla lo consulta antes de desactivar para advertir (CA3).
 */
export async function solicitudesActivasDeLinea(
  lineaId: string,
): Promise<SolicitudCapacitacion[]> {
  if (usaApi('capacitaciones')) {
    // La bandeja del personal, filtrada por la línea; los estados activos se filtran aquí.
    const bandeja = await peticionTodas(
      `/trainings/requests/manage/?line=${encodeURIComponent(lineaId)}`,
      capacitacionGestionDesdeBackend,
    );
    return bandeja.filter((solicitud) => ESTADOS_ACTIVOS.includes(solicitud.estado));
  }
  return simularRed(
    solicitudes
      .filter(
        (solicitud) =>
          solicitud.lineaId === lineaId && ESTADOS_ACTIVOS.includes(solicitud.estado),
      )
      .map(copiarSolicitud),
  );
}

/**
 * Activa o desactiva una línea (HU-09, CA1 y CA3). Al desactivar devuelve las solicitudes
 * activas para que la pantalla advierta antes de confirmar, como el aviso de reservas
 * futuras de HU-16.
 */
export async function cambiarEstadoLinea(
  id: string,
  activa: boolean,
): Promise<{ linea: LineaFormacion; solicitudesActivas: SolicitudCapacitacion[] }> {
  if (usaApi('capacitaciones')) {
    const solicitudesActivas = activa ? [] : await solicitudesActivasDeLinea(id);
    const linea = lineaDesdeBackend(
      await peticion<LineaBackend>(`${RUTA_LINEAS_GESTION}${encodeURIComponent(id)}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: activa }),
      }),
    );
    return { linea, solicitudesActivas };
  }
  if (!lineas.some((linea) => linea.id === id)) {
    throw new ErrorApi(404, 'La línea de formación no existe.');
  }
  const solicitudesActivas = activa ? [] : await solicitudesActivasDeLinea(id);
  lineas = lineas.map((linea) => (linea.id === id ? { ...linea, activa } : linea));
  const actualizada = lineas.find((linea) => linea.id === id);
  if (!actualizada) {
    throw new ErrorApi(404, 'La línea de formación no existe.');
  }
  return simularRed({ linea: { ...actualizada }, solicitudesActivas });
}

// ── HU-10: solicitar capacitación ──────────────────────────────

const MODALIDADES: readonly ModalidadCapacitacion[] = ['presencial', 'virtual'];
const LARGO_MAXIMO_OBJETIVO = 300;
const LARGO_MAXIMO_GRUPO = 200;
const HORA_MS = 60 * 60 * 1000;

/**
 * Lo que llena la persona al solicitar una capacitación (HU-10).
 * Quién solicita, el estado y la fecha de creación los pone la API.
 */
export type FormularioCapacitacion = {
  lineaId: string;
  modalidad: ModalidadCapacitacion;
  /** 'AAAA-MM-DD'. */
  fecha: string;
  /** 'HH:MM'. */
  hora: string;
  objetivo: string;
  grupo: string;
  participantes: number;

  // ── Versión 1.1: formulario completo (#224) ────────────────
  // Opcionales mientras la UI (#251) no los envíe. Con `datosSolicitante` llega el formulario
  // completo: se validan todos y los términos son obligatorios.
  datosSolicitante?: DatosSolicitante;
  asignatura?: string;
  /** Un nombre por persona; si van, uno por participante. */
  nombresParticipantes?: string[];
  novedades?: string;
  /** TERMINOS_FORMACION. */
  terminosAceptados?: boolean;
};

/** Error 400 de la fecha, con otra fecha que sí se puede pedir (CA3). */
export class ErrorCapacitacion extends ErrorApi {
  /** 'AAAA-MM-DD'; la hora la decide la persona. Sin fecha posible en 14 días, no viene. */
  fechaSugerida?: string;

  constructor(mensaje: string, fechaSugerida?: string) {
    super(400, mensaje);
    this.name = 'ErrorCapacitacion';
    this.fechaSugerida = fechaSugerida;
  }
}

/** Validación de los campos obligatorios (CA2): un mensaje claro por campo. */
function errorDeFormulario(datos: FormularioCapacitacion): ErrorApi | null {
  if (!datos.lineaId?.trim()) {
    return new ErrorApi(400, 'Elige la línea de formación.');
  }
  if (!MODALIDADES.includes(datos.modalidad)) {
    return new ErrorApi(400, 'Elige la modalidad: presencial o virtual.');
  }
  if (!esFechaValida(datos.fecha ?? '')) {
    return new ErrorApi(400, 'Elige una fecha válida.');
  }
  if (!esHoraValida(datos.hora ?? '')) {
    return new ErrorApi(400, 'Elige una hora válida.');
  }
  const objetivo = datos.objetivo?.trim() ?? '';
  if (!objetivo) {
    return new ErrorApi(400, 'Escribe el objetivo de la capacitación.');
  }
  if (objetivo.length > LARGO_MAXIMO_OBJETIVO) {
    return new ErrorApi(400, `El objetivo no puede pasar de ${LARGO_MAXIMO_OBJETIVO} caracteres.`);
  }
  const grupo = datos.grupo?.trim() ?? '';
  if (!grupo) {
    return new ErrorApi(400, 'Escribe el grupo al que va dirigida.');
  }
  if (grupo.length > LARGO_MAXIMO_GRUPO) {
    return new ErrorApi(400, `El grupo no puede pasar de ${LARGO_MAXIMO_GRUPO} caracteres.`);
  }
  if (
    !Number.isInteger(datos.participantes) ||
    datos.participantes < 1 ||
    datos.participantes > MAXIMO_PARTICIPANTES
  ) {
    return new ErrorApi(400, MENSAJE_MAXIMO_PARTICIPANTES);
  }
  return errorDeDatosCompletos(datos);
}

/** Los campos de la versión 1.1 (#224), con las mismas reglas del formulario completo. */
function errorDeDatosCompletos(datos: FormularioCapacitacion): ErrorApi | null {
  if (datos.datosSolicitante) {
    const problema = problemaSolicitante(datos.datosSolicitante, { pedirIdentificacion: false });
    if (problema) return new ErrorApi(400, problema);
    if (datos.terminosAceptados !== true) {
      return new ErrorApi(400, 'Acepta los términos y condiciones para enviar la solicitud.');
    }
  }
  if ((datos.asignatura?.trim().length ?? 0) > LARGO_MAXIMO_ASIGNATURA) {
    return new ErrorApi(
      400,
      `La asignatura no puede pasar de ${LARGO_MAXIMO_ASIGNATURA} caracteres.`,
    );
  }
  if ((datos.novedades?.trim().length ?? 0) > LARGO_MAXIMO_NOVEDADES) {
    return new ErrorApi(
      400,
      `Las novedades no pueden pasar de ${LARGO_MAXIMO_NOVEDADES} caracteres.`,
    );
  }
  const nombres = nombresNormalizados(datos.nombresParticipantes);
  const problemaNombres = problemaNombresParticipantes(nombres, datos.participantes);
  return problemaNombres ? new ErrorApi(400, problemaNombres) : null;
}

/** "ana ruiz" → "Ana Ruiz", sin vacíos. */
function nombresNormalizados(nombres: string[] | undefined): string[] {
  return (nombres ?? []).map(aNombrePropio).filter(Boolean);
}

/** Los campos de la versión 1.1 que se guardan en la solicitud; los vacíos no se guardan. */
function camposCompletos(datos: FormularioCapacitacion): Partial<SolicitudCapacitacion> {
  const asignatura = datos.asignatura?.trim();
  const novedades = datos.novedades?.trim();
  const nombres = nombresNormalizados(datos.nombresParticipantes);
  return {
    // Con datosSolicitante, los términos ya se validaron (errorDeDatosCompletos).
    ...(datos.datosSolicitante
      ? {
          datosSolicitante: aDatosSolicitante(valoresSolicitante(datos.datosSolicitante)),
          terminosAceptados: true,
        }
      : {}),
    ...(asignatura ? { asignatura } : {}),
    ...(nombres.length > 0 ? { nombresParticipantes: nombres } : {}),
    ...(novedades ? { novedades } : {}),
  };
}

/** Fecha y hora de la solicitud, en la hora del celular. */
function inicioSolicitud(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00`);
}

/**
 * Solicita una capacitación a nombre del usuario de la sesión (HU-10).
 * Valida los campos (CA2), que la línea esté activa y que la fecha sea hábil y con la
 * anticipación mínima; si no, lanza ErrorCapacitacion con una fecha sugerida (CA3).
 * La solicitud queda pendiente, se notifica (CA1) y queda el registro de uso (HU-25).
 */
export async function solicitarCapacitacion(
  usuario: Usuario,
  datos: FormularioCapacitacion,
): Promise<SolicitudCapacitacion> {
  if (usaApi('capacitaciones')) {
    // El solicitante sale del token; el Backend valida la anticipación y el máximo de 25.
    const creada = await peticion<CapacitacionBackend>('/trainings/requests/', {
      method: 'POST',
      body: JSON.stringify(capacitacionHaciaBackend(datos)),
    });
    return capacitacionDesdeBackend(creada, solicitanteDeSesion());
  }

  // El tipo de usuario sale de la sesión: decide qué datos académicos se exigen.
  const formulario: FormularioCapacitacion = datos.datosSolicitante
    ? { ...datos, datosSolicitante: { ...datos.datosSolicitante, tipo: usuario.tipo } }
    : datos;
  const error = errorDeFormulario(formulario);
  if (error) {
    throw error;
  }

  const activas = await lineasActivas();
  const linea = activas.find((actual) => actual.id === datos.lineaId);
  if (!linea) {
    throw new ErrorApi(400, 'La línea de formación no está disponible.');
  }

  const parametros = await obtenerParametros();
  if (!esDiaHabil(datos.fecha, parametros)) {
    throw new ErrorCapacitacion(
      `Esa fecha no es un día hábil: ${motivoNoDisponible(datos.fecha, parametros)}. Elige otra.`,
      sugerirFechaHabil(datos.fecha, datos.hora, parametros),
    );
  }
  const minimo = Date.now() + parametros.horasMinimasSolicitud * HORA_MS;
  if (inicioSolicitud(datos.fecha, datos.hora).getTime() < minimo) {
    throw new ErrorCapacitacion(
      `Solicítala con al menos ${parametros.horasMinimasSolicitud} horas de anticipación.`,
      sugerirFechaHabil(sumarDias(datos.fecha, 1), datos.hora, parametros),
    );
  }

  const nueva: SolicitudCapacitacion = {
    id: `cap-${Date.now()}-${solicitudes.length + 1}`,
    lineaId: linea.id,
    linea: linea.nombre,
    solicitante: {
      id: usuario.id,
      nombre: usuario.nombre,
      tipo: usuario.tipo,
      ...(usuario.programa ? { programa: usuario.programa } : {}),
    },
    modalidad: datos.modalidad,
    fecha: datos.fecha,
    hora: datos.hora,
    objetivo: datos.objetivo.trim(),
    grupo: datos.grupo.trim(),
    participantes: datos.participantes,
    estado: 'pendiente',
    creada: ahoraFechaHora(),
    ...camposCompletos(formulario),
  };
  solicitudes = [...solicitudes, nueva];

  crearNotificacion({
    usuarioId: usuario.id,
    solicitudId: nueva.id,
    titulo: 'Solicitud de capacitación recibida',
    mensaje: `Recibimos tu solicitud de ${linea.nombre} para el ${nueva.fecha} a las ${nueva.hora}. Queda pendiente de revisión.`,
  });
  registrarEvento('capacitacion', nueva.id, 'pendiente', usuario.nombre, 'Solicitud enviada.');
  registrarUso({
    // El mismo id que usará la gestión: así la capacitación no cuenta doble en HU-26.
    id: `uso-capacitacion-${nueva.id}`,
    usuario,
    servicio: 'capacitaciones',
    finalidad: `${linea.nombre}: ${nueva.objetivo}`,
    tematica: linea.nombre,
    fecha: nueva.fecha,
    modalidad: nueva.modalidad,
    estado: 'pendiente',
  });

  return simularRed(copiarSolicitud(nueva));
}

/** Solicitudes de capacitación del usuario, la más reciente primero (HU-10 y HU-08). */
export async function obtenerMisCapacitaciones(
  usuarioId: string,
): Promise<SolicitudCapacitacion[]> {
  if (usaApi('capacitaciones')) {
    // El Backend ya las devuelve de la más reciente a la más antigua.
    return peticionTodas<CapacitacionBackend, SolicitudCapacitacion>(
      '/trainings/requests/',
      (solicitud) => capacitacionDesdeBackend(solicitud, solicitanteDeSesion()),
    );
  }
  // Al revés antes de ordenar: si dos tienen el mismo minuto, va primero la última creada.
  const mias = solicitudes
    .filter((solicitud) => solicitud.solicitante.id === usuarioId)
    .reverse()
    .sort((a, b) => b.creada.localeCompare(a.creada));
  return simularRed(mias.map(copiarSolicitud));
}

// ── HU-12: gestionar las solicitudes de formación ──────────────────────────
// Cada cambio de estado deja tres rastros (regla de la iteración 4): una notificación al
// solicitante, un evento en el historial (HU-08) y la actualización del registro de uso (HU-25).
// El permiso `formacion` lo comprueba la pantalla con useRol(); la API real lo valida por token.

/** Lo que el personal puede hacer con una solicitud. */
export type DecisionCapacitacion = 'aprobar' | 'rechazar' | 'nueva_fecha';

/** Estados desde los que se puede decidir: la solicitud sigue en curso. */
const ESTADOS_GESTIONABLES: readonly EstadoSolicitud[] = ['pendiente', 'nueva_fecha'];

/** Autor que queda en el historial cuando actúa el personal. */
const AUTOR_PERSONAL = 'Personal de la biblioteca';

/** Largo máximo del resultado al cerrar y del motivo al rechazar. */
const LARGO_MAXIMO_TEXTO = 300;

/** Copia de la solicitud con el cambio aplicado, o 404 si no existe. */
function buscarSolicitud(id: string): SolicitudCapacitacion {
  const solicitud = solicitudes.find((actual) => actual.id === id);
  if (!solicitud) {
    throw new ErrorApi(404, 'La solicitud de capacitación no existe.');
  }
  return solicitud;
}

/**
 * Estados a los que solo se llega con una respuesta del personal (#307): desde el primero, la
 * solicitud cuenta para el tiempo de respuesta. Cancelar la persona no es una respuesta.
 */
const ESTADOS_RESPONDIDOS: readonly EstadoSolicitud[] = [
  'aprobada',
  'rechazada',
  'nueva_fecha',
  'realizada',
];

/** Deja la solicitud en el almacén y avisa al solicitante (CA1 y CA3). */
function guardarSolicitud(
  actualizada: SolicitudCapacitacion,
  titulo: string,
  mensaje: string,
): SolicitudCapacitacion {
  solicitudes = solicitudes.map((actual) => (actual.id === actualizada.id ? actualizada : actual));
  crearNotificacion({
    usuarioId: actualizada.solicitante.id,
    solicitudId: actualizada.id,
    titulo,
    mensaje,
  });
  // HU-25: el mismo registro de la solicitud se actualiza, no se duplica (regla del #181).
  registrarUso({
    id: `uso-capacitacion-${actualizada.id}`,
    servicio: 'capacitaciones',
    finalidad: `${actualizada.linea}: ${actualizada.objetivo}`,
    tematica: actualizada.linea,
    // #307: aprobar, rechazar o proponer otra fecha es la respuesta del personal.
    respondida: ESTADOS_RESPONDIDOS.includes(actualizada.estado),
    fecha: actualizada.fecha,
    modalidad: actualizada.modalidad,
    estado:
      actualizada.estado === 'realizada'
        ? 'completada'
        : actualizada.estado === 'cancelada' || actualizada.estado === 'rechazada'
          ? 'cancelada'
          : 'pendiente',
    ...datosDeSolicitante(actualizada.solicitante.id),
  });
  return { ...actualizada };
}

/**
 * Solicitudes para la bandeja de Gestión → Solicitudes (HU-12). Sin estado, todas; con estado,
 * solo ese. La más reciente primero, para que lo nuevo quede arriba.
 */
export function obtenerSolicitudesCapacitacion(
  estado: EstadoSolicitud | 'todas' = 'todas',
): Promise<SolicitudCapacitacion[]> {
  if (usaApi('capacitaciones')) {
    return peticionTodas(RUTA_GESTION_CAPACITACIONES, capacitacionGestionDesdeBackend)
      .then((lista) => estado === 'todas' ? lista : lista.filter((s) => s.estado === estado));
  }
  const lista = (estado === 'todas'
    ? solicitudes
    : solicitudes.filter((solicitud) => solicitud.estado === estado)
  )
    .slice()
    .sort((a, b) => b.creada.localeCompare(a.creada));
  return simularRed(lista.map(copiarSolicitud));
}

const RUTA_GESTION_CAPACITACIONES = '/trainings/requests/manage/';

export async function obtenerSolicitudCapacitacion(id: string) {
  if (usaApi('capacitaciones')) {
    const detalle = await peticion<CapacitacionGestionBackend>(
      `${RUTA_GESTION_CAPACITACIONES}${encodeURIComponent(id)}/`,
    );
    return {
      solicitud: capacitacionGestionDesdeBackend(detalle),
      historial: historialDesdeBackend(detalle.id, 'TRAINING', detalle.history ?? []),
    };
  }
  return { solicitud: copiarSolicitud(buscarSolicitud(id)), historial: historialDePrueba('capacitacion', id) };
}

export async function obtenerResponsablesCapacitacion() {
  if (usaApi('capacitaciones')) {
    const personas = await peticion<ResponsableBackend[]>(`${RUTA_GESTION_CAPACITACIONES}responsibles/`);
    return personas.map((persona) => ({ id: persona.id, nombre: persona.name, roles: '' }));
  }
  return USUARIOS_DIRECTORIO.filter((persona) => tienePermiso(persona, 'formacion'))
    .map((persona) => ({ id: persona.id, nombre: persona.nombre, roles: describirRoles(persona) }));
}

async function modificarCapacitacion(id: string, accion: string, cuerpo: object) {
  return capacitacionGestionDesdeBackend(await peticion<CapacitacionGestionBackend>(
    `${RUTA_GESTION_CAPACITACIONES}${encodeURIComponent(id)}/${accion}/`,
    { method: 'POST', body: JSON.stringify(cuerpo) },
  ));
}

export async function cancelarMiCapacitacion(id: string, motivo: string, usuario: Usuario): Promise<void> {
  const reason = motivo.trim();
  if (!reason) throw new ErrorApi(400, 'Indica el motivo de la cancelación.');
  if (usaApi('capacitaciones')) {
    await peticion('/trainings/requests/' + encodeURIComponent(id) + '/cancel/', {
      method: 'POST', body: JSON.stringify({ reason }),
    });
    return;
  }
  const plazo = await obtenerPlazoCancelacion(false);
  const capacitacion = buscarSolicitud(id);
  if (capacitacion.solicitante.id !== usuario.id) throw new ErrorApi(404, 'No encontramos tu capacitación.');
  if (!puedeCancelarSolicitud('capacitacion', capacitacion.estado, capacitacion.fecha, capacitacion.hora, plazo)) {
    throw new ErrorApi(400, 'Esta capacitación ya no se puede cancelar.');
  }
  guardarSolicitud({ ...capacitacion, estado: 'cancelada', motivo: reason }, 'Capacitación cancelada', reason);
  registrarEvento('capacitacion', id, 'cancelada', usuario.nombre, reason);
  await simularRed(null);
}

export async function cancelarCapacitacionPersonal(id: string, motivo: string) {
  const reason = motivo.trim();
  if (!reason) throw new ErrorApi(400, 'Indica el motivo de la cancelación.');
  if (usaApi('capacitaciones')) return modificarCapacitacion(id, 'cancel', { reason });
  const solicitud = buscarSolicitud(id);
  if (!ESTADOS_GESTIONABLES.includes(solicitud.estado) && solicitud.estado !== 'aprobada') {
    throw new ErrorApi(400, 'Esta capacitación ya no se puede cancelar.');
  }
  registrarEvento('capacitacion', id, 'cancelada', useSesion.getState().usuario?.nombre ?? AUTOR_PERSONAL, reason);
  return simularRed(guardarSolicitud(
    { ...solicitud, estado: 'cancelada', motivo: reason },
    'Capacitación cancelada',
    reason,
  ));
}

/** Aprueba una solicitud pendiente (CA1). */
export async function aprobarCapacitacion(id: string): Promise<SolicitudCapacitacion> {
  if (usaApi('capacitaciones')) return modificarCapacitacion(id, 'approve', {});
  const solicitud = buscarSolicitud(id);
  if (!ESTADOS_GESTIONABLES.includes(solicitud.estado)) {
    throw new ErrorApi(400, 'Esta solicitud ya no se puede aprobar.');
  }
  const actualizada: SolicitudCapacitacion = {
    ...solicitud,
    estado: 'aprobada',
    motivo: undefined,
  };
  const guardada = guardarSolicitud(
    actualizada,
    'Capacitación aprobada',
    `Tu solicitud de ${solicitud.linea} para el ${solicitud.fecha} a las ${solicitud.hora} fue aprobada.`,
  );
  registrarEvento('capacitacion', id, 'aprobada', AUTOR_PERSONAL);
  return simularRed(guardada);
}

/** Rechaza una solicitud; el motivo es obligatorio (CA2). */
export async function rechazarCapacitacion(
  id: string,
  motivo: string,
): Promise<SolicitudCapacitacion> {
  if (usaApi('capacitaciones')) return modificarCapacitacion(id, 'reject', { reason: motivo.trim() });
  const solicitud = buscarSolicitud(id);
  if (!ESTADOS_GESTIONABLES.includes(solicitud.estado)) {
    throw new ErrorApi(400, 'Esta solicitud ya no se puede rechazar.');
  }
  const texto = motivo?.trim() ?? '';
  if (!texto) {
    throw new ErrorApi(400, 'Escribe el motivo del rechazo.');
  }
  if (texto.length > LARGO_MAXIMO_TEXTO) {
    throw new ErrorApi(400, `El motivo no puede pasar de ${LARGO_MAXIMO_TEXTO} caracteres.`);
  }
  const actualizada: SolicitudCapacitacion = { ...solicitud, estado: 'rechazada', motivo: texto };
  const guardada = guardarSolicitud(
    actualizada,
    'Capacitación rechazada',
    `Tu solicitud de ${solicitud.linea} fue rechazada: ${texto}`,
  );
  registrarEvento('capacitacion', id, 'rechazada', AUTOR_PERSONAL, texto);
  return simularRed(guardada);
}

/**
 * Propone otra fecha y hora (CA1 y CA4). La solicitud queda `nueva_fecha` y el usuario debe
 * aceptarla; la fecha debe ser hábil y con la anticipación mínima (mismas reglas que HU-10).
 */
export async function proponerFechaCapacitacion(
  id: string,
  fecha: string,
  hora: string,
): Promise<SolicitudCapacitacion> {
  if (usaApi('capacitaciones')) {
    return modificarCapacitacion(id, 'propose-date', { proposed_date: fecha, proposed_time: hora });
  }
  const solicitud = buscarSolicitud(id);
  if (!ESTADOS_GESTIONABLES.includes(solicitud.estado)) {
    throw new ErrorApi(400, 'Esta solicitud ya no se puede reprogramar.');
  }
  if (!esFechaValida(fecha) || !esHoraValida(hora)) {
    throw new ErrorApi(400, 'Elige una fecha y una hora válidas.');
  }
  const parametros = await obtenerParametros();
  if (!esDiaHabil(fecha, parametros)) {
    throw new ErrorApi(400, `Esa fecha no es hábil: ${motivoNoDisponible(fecha, parametros)}.`);
  }
  // Mismas reglas que HU-10: ni fechas pasadas ni sin la anticipación mínima.
  const inicio = new Date(`${fecha}T${hora}:00`);
  if (fecha < hoyISO()) {
    throw new ErrorApi(400, 'Esa fecha ya pasó. Elige una futura.');
  }
  if (inicio.getTime() < Date.now() + parametros.horasMinimasSolicitud * 60 * 60 * 1000) {
    throw new ErrorApi(
      400,
      `La nueva fecha necesita al menos ${parametros.horasMinimasSolicitud} horas de anticipación.`,
    );
  }
  const actualizada: SolicitudCapacitacion = {
    ...solicitud,
    estado: 'nueva_fecha',
    fechaPropuesta: fecha,
    horaPropuesta: hora,
    motivo: undefined,
  };
  const guardada = guardarSolicitud(
    actualizada,
    'Nueva fecha para tu capacitación',
    `Proponemos el ${fecha} a las ${hora} para tu capacitación de ${solicitud.linea}. Acepta o rechaza la fecha en Mis solicitudes.`,
  );
  registrarEvento(
    'capacitacion',
    id,
    'nueva_fecha',
    AUTOR_PERSONAL,
    `Nueva fecha: ${fecha} a las ${hora}.`,
  );
  return simularRed(guardada);
}

/** Asigna el responsable que atenderá la capacitación (CA3, primer paso para cerrarla). */
export async function asignarResponsable(
  id: string,
  usuarioId: string,
): Promise<SolicitudCapacitacion> {
  if (usaApi('capacitaciones')) return modificarCapacitacion(id, 'assign', { responsible: usuarioId });
  const solicitud = buscarSolicitud(id);
  if (solicitud.estado !== 'aprobada') {
    throw new ErrorApi(400, 'Solo se asigna responsable a una solicitud aprobada.');
  }
  const persona = USUARIOS_DIRECTORIO.find((usuario) => usuario.id === usuarioId);
  if (!persona) {
    throw new ErrorApi(404, 'La persona responsable no existe.');
  }
  const actualizada: SolicitudCapacitacion = {
    ...solicitud,
    responsableId: persona.id,
    responsable: persona.nombre,
  };
  solicitudes = solicitudes.map((actual) => (actual.id === id ? actualizada : actual));
  registrarEvento('capacitacion', id, 'aprobada', AUTOR_PERSONAL, `Responsable: ${persona.nombre}.`);
  // La persona asignada se entera en su campana (HU-12 UI). No es un cambio de estado: no
  // toca el registro de uso. Si se reasigna a la misma persona, no se le avisa otra vez.
  if (solicitud.responsableId !== persona.id) {
    crearNotificacion({
      usuarioId: persona.id,
      solicitudId: id,
      titulo: 'Te asignaron una capacitación',
      mensaje: `Atenderás la capacitación de ${solicitud.linea} para ${solicitud.solicitante.nombre} (${solicitud.grupo}), el ${solicitud.fecha} a las ${solicitud.hora}. Está en Gestión → Solicitudes → Capacitaciones.`,
    });
  }
  return simularRed({ ...actualizada });
}

/** Cierra la solicitud con el resultado (CA3): exige responsable y resultado. */
export async function cerrarCapacitacion(
  id: string,
  resultado: string,
  participantesReales?: number,
): Promise<SolicitudCapacitacion> {
  if (usaApi('capacitaciones')) {
    if (participantesReales == null || !Number.isInteger(participantesReales) ||
        participantesReales < 0 || participantesReales > 32767) {
      throw new ErrorApi(400, 'Indica el número de asistentes reales.');
    }
    return modificarCapacitacion(id, 'close', {
      result: resultado.trim(), actual_participants: participantesReales,
    });
  }
  const solicitud = buscarSolicitud(id);
  if (solicitud.estado !== 'aprobada') {
    throw new ErrorApi(400, 'Solo se cierra una solicitud aprobada.');
  }
  if (!solicitud.responsableId) {
    throw new ErrorApi(400, 'Asigna un responsable antes de cerrar la solicitud.');
  }
  const texto = resultado?.trim() ?? '';
  if (!texto) {
    throw new ErrorApi(400, 'Escribe el resultado de la capacitación.');
  }
  if (texto.length > LARGO_MAXIMO_TEXTO) {
    throw new ErrorApi(400, `El resultado no puede pasar de ${LARGO_MAXIMO_TEXTO} caracteres.`);
  }
  const actualizada: SolicitudCapacitacion = { ...solicitud, estado: 'realizada', resultado: texto };
  const guardada = guardarSolicitud(
    actualizada,
    'Capacitación realizada',
    `Tu capacitación de ${solicitud.linea} quedó cerrada. Resultado: ${texto}`,
  );
  registrarEvento('capacitacion', id, 'realizada', AUTOR_PERSONAL, texto);
  // #254: invita a calificar. Solo se cierra una aprobada, así que no se repite.
  crearNotificacion({
    usuarioId: solicitud.solicitante.id,
    solicitudId: id,
    titulo: '¿Cómo te pareció tu capacitación?',
    mensaje: MENSAJE_INVITACION_CALIFICAR,
  });
  return simularRed(guardada);
}

/**
 * La comunidad responde a la nueva fecha (CA4): al aceptar queda `aprobada` y al no aceptar,
 * `cancelada`. Solo aplica a una solicitud en `nueva_fecha`.
 */
export async function responderNuevaFecha(
  id: string,
  acepta: boolean,
): Promise<SolicitudCapacitacion> {
  if (usaApi('capacitaciones')) {
    const accion = acepta ? 'accept-date' : 'decline-date';
    const respondida = await peticion<CapacitacionBackend>(
      `/trainings/requests/${encodeURIComponent(id)}/${accion}/`,
      { method: 'POST', body: JSON.stringify({}) },
    );
    return capacitacionDesdeBackend(respondida, solicitanteDeSesion());
  }
  const solicitud = buscarSolicitud(id);
  if (solicitud.estado !== 'nueva_fecha') {
    throw new ErrorApi(400, 'Esta solicitud no tiene una nueva fecha por responder.');
  }
  const estado: EstadoSolicitud = acepta ? 'aprobada' : 'cancelada';
  const actualizada: SolicitudCapacitacion = {
    ...solicitud,
    estado,
    // Al aceptar, la fecha propuesta pasa a ser la de la cita.
    ...(acepta
      ? { fecha: solicitud.fechaPropuesta ?? solicitud.fecha, hora: solicitud.horaPropuesta ?? solicitud.hora }
      : { motivo: 'No aceptó la nueva fecha propuesta.' }),
    fechaPropuesta: undefined,
    horaPropuesta: undefined,
  };
  const guardada = guardarSolicitud(
    actualizada,
    acepta ? 'Nueva fecha aceptada' : 'Capacitación cancelada',
    acepta
      ? `Tu capacitación de ${solicitud.linea} quedó para el ${actualizada.fecha} a las ${actualizada.hora}.`
      : `Cancelaste la capacitación de ${solicitud.linea} al no aceptar la nueva fecha.`,
  );
  registrarEvento(
    'capacitacion',
    id,
    estado,
    solicitud.solicitante.nombre,
    acepta ? 'Aceptó la nueva fecha.' : 'No aceptó la nueva fecha.',
  );
  return simularRed(guardada);
}

// ── Versión 1.1: calificación del servicio (#254) ─────────────────────────

/**
 * La persona califica su capacitación realizada, una sola vez (CA1): puntaje de 1 a 5 y
 * comentario opcional. 404 si no existe, 403 si no es suya y 400 si no está realizada (CA2) o si
 * ya la calificó. Deja el evento en el historial (HU-08) y el puntaje en el mismo registro de uso
 * (HU-25) para el promedio de HU-26 (CA3).
 */
export async function calificarCapacitacion(
  usuario: Usuario,
  id: string,
  datos: DatosCalificacion,
): Promise<SolicitudCapacitacion> {
  if (usaApi('capacitaciones')) {
    // Una vez y cuando ya terminó (409 si no); quien califica sale del token.
    const calificada = await peticion<CapacitacionBackend>(
      `/trainings/requests/${encodeURIComponent(id)}/rate/`,
      {
        method: 'POST',
        body: JSON.stringify({ quality_rating: datos.puntaje, comment: datos.comentario ?? '' }),
      },
    );
    return capacitacionDesdeBackend(calificada, solicitanteDeSesion());
  }

  const solicitud = buscarSolicitud(id);
  if (solicitud.solicitante.id !== usuario.id) {
    throw new ErrorApi(403, 'Solo quien pidió la capacitación puede calificarla.');
  }
  if (solicitud.estado !== 'realizada') {
    throw new ErrorApi(400, 'Solo puedes calificar una capacitación realizada.');
  }
  if (solicitud.calificacion) {
    throw new ErrorApi(400, 'Ya calificaste esta capacitación.');
  }
  const problema = problemaCalificacion(datos);
  if (problema) {
    throw new ErrorApi(400, problema);
  }

  const calificacion = crearCalificacion(datos);
  const actualizada: SolicitudCapacitacion = { ...solicitud, calificacion };
  solicitudes = solicitudes.map((actual) => (actual.id === id ? actualizada : actual));
  registrarEvento(
    'capacitacion',
    id,
    'realizada',
    usuario.nombre,
    notaCalificacion(calificacion.puntaje),
  );
  registrarUso({
    id: `uso-capacitacion-${id}`,
    servicio: 'capacitaciones',
    finalidad: `${actualizada.linea}: ${actualizada.objetivo}`,
    fecha: actualizada.fecha,
    modalidad: actualizada.modalidad,
    estado: 'completada',
    calificacion: calificacion.puntaje,
    ...datosDeSolicitante(actualizada.solicitante.id),
  });
  return simularRed({ ...copiarSolicitud(actualizada), calificacion: { ...calificacion } });
}
