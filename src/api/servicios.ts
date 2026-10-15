/**
 * EJEMPLO DE REFERENCIA del patrón de datos: pantalla → hook → función de API → mock.
 * Copien esta forma para cada HU de datos.
 *
 * Servicios de la biblioteca: lectura para la comunidad (HU-01) y administración (HU-04).
 * La ruta '/servicios/' es provisional: confírmenla con el equipo de Backend.
 */
import type { Servicio } from '@/types';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { SERVICIOS } from './mocks/servicios';

/** Copia mutable: con mocks, lo que crea o edita la administración se ve durante la sesión de la app. */
let servicios: Servicio[] = SERVICIOS.map((servicio) => ({ ...servicio }));

/** Datos que envía el formulario de la administración; el id lo asigna el sistema (HU-04). */
export type DatosServicio = Omit<Servicio, 'id'>;

/** Servicios activos, para la comunidad (HU-01). */
export function obtenerServicios(): Promise<Servicio[]> {
  if (USAR_MOCKS) {
    return simularRed(servicios.filter((servicio) => servicio.activo).map((s) => ({ ...s })));
  }
  return peticion<Servicio[]>('/servicios/');
}

/** Detalle de un servicio (HU-01). Falla con ErrorApi 404 si no existe o está inactivo. */
export function obtenerServicio(id: string): Promise<Servicio> {
  if (USAR_MOCKS) {
    const servicio = servicios.find((s) => s.id === id && s.activo);
    if (!servicio) {
      return Promise.reject(new ErrorApi(404, `No existe el servicio ${id}`));
    }
    return simularRed({ ...servicio });
  }
  return peticion<Servicio>(`/servicios/${id}/`);
}

/** Todos los servicios, también los inactivos, para la administración (HU-04). */
export function obtenerTodosLosServicios(): Promise<Servicio[]> {
  if (USAR_MOCKS) {
    return simularRed(servicios.map((servicio) => ({ ...servicio })));
  }
  return peticion<Servicio[]>('/servicios/?todos=1');
}

/** Validación de la HU-04 (CA3): los campos de texto son obligatorios. */
function errorDeValidacion(datos: DatosServicio): ErrorApi | null {
  const obligatorios: [keyof DatosServicio, string][] = [
    ['nombre', 'El nombre es obligatorio.'],
    ['descripcion', 'La descripción es obligatoria.'],
    ['publico', 'El público objetivo es obligatorio.'],
    ['formaSolicitud', 'La forma de solicitud es obligatoria.'],
    ['horario', 'El horario es obligatorio.'],
  ];
  for (const [campo, mensaje] of obligatorios) {
    const valor = datos[campo];
    if (typeof valor !== 'string' || !valor.trim()) {
      return new ErrorApi(400, mensaje);
    }
  }
  return null;
}

export function crearServicio(datos: DatosServicio): Promise<Servicio> {
  if (USAR_MOCKS) {
    const error = errorDeValidacion(datos);
    if (error) {
      return Promise.reject(error);
    }
    const nuevo: Servicio = { ...datos, id: `servicio-${Date.now()}` };
    servicios = [...servicios, nuevo];
    return simularRed({ ...nuevo });
  }
  return peticion<Servicio>('/servicios/', { method: 'POST', body: JSON.stringify(datos) });
}

export function editarServicio(id: string, datos: DatosServicio): Promise<Servicio> {
  if (USAR_MOCKS) {
    const indice = servicios.findIndex((servicio) => servicio.id === id);
    if (indice === -1) {
      return Promise.reject(new ErrorApi(404, 'El servicio no existe.'));
    }
    const error = errorDeValidacion(datos);
    if (error) {
      return Promise.reject(error);
    }
    servicios = servicios.map((servicio, i) => (i === indice ? { ...datos, id } : servicio));
    return simularRed({ ...servicios[indice] });
  }
  return peticion<Servicio>(`/servicios/${id}/`, { method: 'PUT', body: JSON.stringify(datos) });
}

/** Activa o desactiva un servicio (HU-04, CA2): un servicio inactivo no se muestra a la comunidad. */
export function cambiarEstadoServicio(id: string, activo: boolean): Promise<Servicio> {
  if (USAR_MOCKS) {
    const indice = servicios.findIndex((servicio) => servicio.id === id);
    if (indice === -1) {
      return Promise.reject(new ErrorApi(404, 'El servicio no existe.'));
    }
    servicios = servicios.map((servicio, i) => (i === indice ? { ...servicio, activo } : servicio));
    return simularRed({ ...servicios[indice] });
  }
  return peticion<Servicio>(`/servicios/${id}/estado/`, {
    method: 'PATCH',
    body: JSON.stringify({ activo }),
  });
}
