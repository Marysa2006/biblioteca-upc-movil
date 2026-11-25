/**
 * EJEMPLO DE REFERENCIA del patrón de datos: pantalla → hook → función de API → mock.
 * Copien esta forma para cada HU de datos.
 *
 * Servicios de la biblioteca: lectura para la comunidad (HU-01) y administración (HU-04).
 * El portal público usa rutas de Django. Las rutas de administración siguen siendo provisionales.
 */
import type { Servicio } from '@/types';
import { normalizarTexto } from '@/utils/texto';

import {
  categoriaServicioHaciaBackend,
  fichaDesdePortal,
  servicioGestionDesdeBackend,
  servicioHaciaBackend,
  serviciosDesdePortal,
  type CategoriaServicioBackend,
  type FichaPortal,
  type FichaServicio,
  type ServicioGestionBackend,
  type ServiciosPortal,
} from './backend/servicios';
import { ErrorApi, peticion, peticionTodas, simularRed, usaApi } from './cliente';
import { SERVICIOS } from './mocks/servicios';

/** Copia mutable: con mocks, lo que crea o edita la administración se ve durante la sesión de la app. */
let servicios: Servicio[] = SERVICIOS.map((servicio) => ({ ...servicio }));

/** Datos que envía el formulario de la administración; el id lo asigna el sistema (HU-04). */
export type DatosServicio = Omit<Servicio, 'id'>;
const RUTA_GESTION = '/portal/manage/services/';

function categoriasDeGestion() {
  return peticion<CategoriaServicioBackend[]>('/portal/manage/service-categories/');
}

async function guardarServicioBackend(datos: DatosServicio, id?: string) {
  const error = errorDeValidacion(datos);
  if (error) throw error;
  const ruta = id ? `${RUTA_GESTION}${encodeURIComponent(id)}/` : RUTA_GESTION;
  const [categorias, anterior] = await Promise.all([
    categoriasDeGestion(),
    id ? peticion<ServicioGestionBackend>(ruta) : undefined,
  ]);
  const categoriaAnterior = anterior && servicioGestionDesdeBackend(anterior, categorias).categoria;
  const categoria = anterior && categoriaAnterior === datos.categoria
    ? anterior.category : categoriaServicioHaciaBackend(datos.categoria, categorias);
  if (categoria === undefined) throw new ErrorApi(400, 'Esa categoría no existe en el portal.');
  const slug = id ?? normalizarTexto(datos.nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) throw new ErrorApi(400, 'El nombre debe incluir letras o números.');
  const servicio = await peticion<ServicioGestionBackend>(ruta, {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(servicioHaciaBackend(datos, categoria, slug, anterior, categoriaAnterior === datos.categoria)),
  });
  return servicioGestionDesdeBackend(servicio, categorias);
}

/** Servicios activos, para la comunidad (HU-01). */
export async function obtenerServicios(): Promise<Servicio[]> {
  if (!usaApi('servicios')) {
    return simularRed(servicios.filter((servicio) => servicio.activo).map((s) => ({ ...s })));
  }
  return serviciosDesdePortal(await peticion<ServiciosPortal>('/portal/services/'));
}

/** Detalle de un servicio (HU-01). Falla con ErrorApi 404 si no existe o está inactivo. */
export async function obtenerServicio(id: string): Promise<FichaServicio> {
  if (!usaApi('servicios')) {
    const servicio = servicios.find((s) => s.id === id && s.activo);
    if (!servicio) {
      return Promise.reject(new ErrorApi(404, `No existe el servicio ${id}`));
    }
    return simularRed({ ...servicio });
  }
  const ficha = fichaDesdePortal(
    await peticion<FichaPortal>(`/portal/services/${encodeURIComponent(id)}/`),
  );
  if (!ficha) throw new ErrorApi(404, `No existe el servicio ${id}`);
  return ficha;
}

/** Todos los servicios, también los inactivos, para la administración (HU-04). */
export function obtenerTodosLosServicios(): Promise<Servicio[]> {
  if (usaApi('servicios')) {
    return Promise.all([
      peticionTodas<ServicioGestionBackend, ServicioGestionBackend>(RUTA_GESTION, (servicio) => servicio),
      categoriasDeGestion(),
    ]).then(([lista, categorias]) => lista.map((servicio) => servicioGestionDesdeBackend(servicio, categorias)));
  }
  return simularRed(servicios.map((servicio) => ({ ...servicio })));
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
  if (usaApi('servicios')) return guardarServicioBackend(datos);
  const error = errorDeValidacion(datos);
  if (error) {
    return Promise.reject(error);
  }
  const nuevo: Servicio = { ...datos, id: `servicio-${Date.now()}` };
  servicios = [...servicios, nuevo];
  return simularRed({ ...nuevo });
}

export function editarServicio(id: string, datos: DatosServicio): Promise<Servicio> {
  if (usaApi('servicios')) return guardarServicioBackend(datos, id);
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

/** Activa o desactiva un servicio (HU-04, CA2): un servicio inactivo no se muestra a la comunidad. */
export function cambiarEstadoServicio(id: string, activo: boolean): Promise<Servicio> {
  if (usaApi('servicios')) {
    return Promise.all([
      peticion<ServicioGestionBackend>(`${RUTA_GESTION}${encodeURIComponent(id)}/`, {
        method: 'PATCH', body: JSON.stringify({ is_active: activo }),
      }),
      categoriasDeGestion(),
    ]).then(([servicio, categorias]) => servicioGestionDesdeBackend(servicio, categorias));
  }
  const indice = servicios.findIndex((servicio) => servicio.id === id);
  if (indice === -1) {
    return Promise.reject(new ErrorApi(404, 'El servicio no existe.'));
  }
  servicios = servicios.map((servicio, i) => (i === indice ? { ...servicio, activo } : servicio));
  return simularRed({ ...servicios[indice] });
}
