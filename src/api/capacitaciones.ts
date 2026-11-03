/**
 * Capacitaciones: líneas de formación (HU-09), solicitudes (HU-10) y, más adelante, su
 * gestión (HU-12).
 * Lista, crea y edita líneas y cambia su estado; avisa si una línea tiene solicitudes activas
 * antes de desactivarla (CA3). La comunidad solicita una capacitación sobre una línea activa.
 * Las rutas son provisionales: confírmenlas con el equipo de Backend.
 */
import type {
  EstadoSolicitud,
  LineaFormacion,
  ModalidadCapacitacion,
  Parametros,
  SolicitudCapacitacion,
  Usuario,
} from '@/types';
import { sumarDias } from '@/utils/calendario';
import { esFechaValida, esHoraValida } from '@/utils/fechas';
import { esDiaHabil, motivoNoDisponible } from '@/utils/parametros';
import { ahoraFechaHora } from '@/utils/tablets';
import { normalizarTexto } from '@/utils/texto';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { registrarUso } from './estadisticas';
import { LINEAS_FORMACION, SOLICITUDES_CAPACITACION } from './mocks/capacitaciones';
import { crearNotificacion } from './notificaciones';
import { obtenerParametros } from './parametros';

/** Copia de una solicitud para no exponer el almacén mutable. */
function copiarSolicitud(solicitud: SolicitudCapacitacion): SolicitudCapacitacion {
  return { ...solicitud, solicitante: { ...solicitud.solicitante } };
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

/** Todas las líneas, también las inactivas, para la administración (HU-09). */
export function obtenerLineas(): Promise<LineaFormacion[]> {
  if (USAR_MOCKS) {
    return simularRed(lineas.map((linea) => ({ ...linea })));
  }
  return peticion<LineaFormacion[]>('/capacitaciones/lineas/');
}

/** Las líneas activas, para el formulario de solicitud de HU-10 (CA1). */
export async function lineasActivas(): Promise<LineaFormacion[]> {
  const todas = await obtenerLineas();
  return todas.filter((linea) => linea.activa);
}

export function crearLinea(datos: DatosLinea): Promise<LineaFormacion> {
  if (USAR_MOCKS) {
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
  return peticion<LineaFormacion>('/capacitaciones/lineas/', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export function editarLinea(id: string, datos: DatosLinea): Promise<LineaFormacion> {
  if (USAR_MOCKS) {
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
  return peticion<LineaFormacion>(`/capacitaciones/lineas/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
}

/**
 * Cuántas solicitudes activas (pendientes, aprobadas o con nueva fecha) tiene la línea.
 * La pantalla lo consulta antes de desactivar para advertir (CA3).
 */
export function solicitudesActivasDeLinea(lineaId: string): Promise<SolicitudCapacitacion[]> {
  if (USAR_MOCKS) {
    return simularRed(
      solicitudes
        .filter(
          (solicitud) =>
            solicitud.lineaId === lineaId && ESTADOS_ACTIVOS.includes(solicitud.estado),
        )
        .map(copiarSolicitud),
    );
  }
  return peticion<SolicitudCapacitacion[]>(`/capacitaciones/lineas/${lineaId}/solicitudes-activas/`);
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
  if (USAR_MOCKS) {
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
  return peticion<{ linea: LineaFormacion; solicitudesActivas: SolicitudCapacitacion[] }>(
    `/capacitaciones/lineas/${id}/estado/`,
    { method: 'PATCH', body: JSON.stringify({ activa }) },
  );
}

// ── HU-10: solicitar capacitación ──────────────────────────────

const MODALIDADES: readonly ModalidadCapacitacion[] = ['presencial', 'virtual'];
const LARGO_MAXIMO_OBJETIVO = 300;
const LARGO_MAXIMO_GRUPO = 200;
/** Días que se recorren para sugerir otra fecha (CA3). */
const DIAS_BUSQUEDA_SUGERENCIA = 14;
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
  if (!Number.isInteger(datos.participantes) || datos.participantes < 1) {
    return new ErrorApi(400, 'Indica cuántas personas asistirán (un número entero desde 1).');
  }
  return null;
}

/** Fecha y hora de la solicitud, en la hora del celular. */
function inicioSolicitud(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00`);
}

/**
 * La primera fecha desde `desde` que es hábil y cumple la anticipación mínima a la hora pedida,
 * dentro de 14 días (CA3). Así la sugerencia siempre se puede aceptar tal cual.
 */
function buscarFechaHabil(
  desde: string,
  hora: string,
  parametros: Parametros,
): string | undefined {
  const minimo = Date.now() + parametros.horasMinimasSolicitud * HORA_MS;
  for (let i = 0; i <= DIAS_BUSQUEDA_SUGERENCIA; i += 1) {
    const dia = sumarDias(desde, i);
    if (esDiaHabil(dia, parametros) && inicioSolicitud(dia, hora).getTime() >= minimo) {
      return dia;
    }
  }
  return undefined;
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
  if (!USAR_MOCKS) {
    // Ruta provisional: confirmar con Backend. El solicitante sale del token.
    return peticion<SolicitudCapacitacion>('/capacitaciones/solicitudes/', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
  }

  const error = errorDeFormulario(datos);
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
      buscarFechaHabil(datos.fecha, datos.hora, parametros),
    );
  }
  const minimo = Date.now() + parametros.horasMinimasSolicitud * HORA_MS;
  if (inicioSolicitud(datos.fecha, datos.hora).getTime() < minimo) {
    throw new ErrorCapacitacion(
      `Solicítala con al menos ${parametros.horasMinimasSolicitud} horas de anticipación.`,
      buscarFechaHabil(sumarDias(datos.fecha, 1), datos.hora, parametros),
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
  };
  solicitudes = [...solicitudes, nueva];

  crearNotificacion({
    usuarioId: usuario.id,
    solicitudId: nueva.id,
    titulo: 'Solicitud de capacitación recibida',
    mensaje: `Recibimos tu solicitud de ${linea.nombre} para el ${nueva.fecha} a las ${nueva.hora}. Queda pendiente de revisión.`,
  });
  registrarUso({
    usuario,
    servicio: 'capacitaciones',
    finalidad: `${linea.nombre}: ${nueva.objetivo}`,
    modalidad: nueva.modalidad,
    estado: 'pendiente',
  });

  return simularRed(copiarSolicitud(nueva));
}

/** Solicitudes de capacitación del usuario, la más reciente primero (HU-10 y HU-08). */
export function obtenerMisCapacitaciones(usuarioId: string): Promise<SolicitudCapacitacion[]> {
  if (USAR_MOCKS) {
    // Al revés antes de ordenar: si dos tienen el mismo minuto, va primero la última creada.
    const mias = solicitudes
      .filter((solicitud) => solicitud.solicitante.id === usuarioId)
      .reverse()
      .sort((a, b) => b.creada.localeCompare(a.creada));
    return simularRed(mias.map(copiarSolicitud));
  }
  // Ruta provisional: confirmar con Backend. El usuario sale del token.
  return peticion<SolicitudCapacitacion[]>('/capacitaciones/solicitudes/mias/');
}
