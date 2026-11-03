/**
 * Capacitaciones: líneas de formación (HU-09) y, más adelante, sus solicitudes (HU-10 y HU-12).
 * Lista, crea y edita líneas y cambia su estado; avisa si una línea tiene solicitudes activas
 * antes de desactivarla (CA3).
 * Las rutas son provisionales: confírmenlas con el equipo de Backend.
 */
import type { EstadoSolicitud, LineaFormacion, SolicitudCapacitacion } from '@/types';
import { normalizarTexto } from '@/utils/texto';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { LINEAS_FORMACION, SOLICITUDES_CAPACITACION } from './mocks/capacitaciones';

/** Copias mutables: con mocks, lo que se crea o edita se ve durante la sesión. */
let lineas: LineaFormacion[] = LINEAS_FORMACION.map((linea) => ({ ...linea }));

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
      SOLICITUDES_CAPACITACION.filter(
        (solicitud) =>
          solicitud.lineaId === lineaId && ESTADOS_ACTIVOS.includes(solicitud.estado),
      ).map((solicitud) => ({ ...solicitud })),
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
