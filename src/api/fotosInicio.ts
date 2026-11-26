/**
 * Fotos del carrusel de Inicio (#290, versión 1.1).
 * - La comunidad consulta las publicadas, sin sesión, como los avisos.
 * - Las administra quien tenga el permiso `fotos` (#296; 403 en los demás casos):
 *   crear, editar, publicar u ocultar y cambiar el orden.
 * - Se publican máximo MAXIMO_FOTOS_INICIO (400 si se pasa) y la descripción es obligatoria.
 *
 * Con la API (módulo `fotosInicio` de `usaApi()`), la comunidad lee `GET /portal/home-photos/`.
 * La administración (`/portal/manage/home-photos/`, la imagen en `image` por multipart) sigue con
 * datos de prueba hasta la fase 4 de la integración.
 */
import type { FotoInicio, Usuario } from '@/types';
import {
  fotosPublicadas,
  LARGO_MAXIMO_DESCRIPCION_FOTO,
  MAXIMO_FOTOS_INICIO,
  MENSAJE_MAXIMO_FOTOS,
} from '@/utils/inicio';
import { tienePermiso } from '@/utils/roles';

import { cuerpoFotoInicio, fotoInicioDesdeBackend, type FotoInicioBackend } from './backend/portal';
import { ErrorApi, peticion, simularRed, usaApi } from './cliente';
import { FOTOS_INICIO } from './mocks/fotosInicio';

/** Copia mutable: con mocks, los cambios se ven durante la sesión de la app. */
let fotos: FotoInicio[] = FOTOS_INICIO.map((foto) => ({ ...foto }));
/** Para que dos fotos creadas en el mismo milisegundo no repitan el id. */
let siguienteId = 1;

/** Lo que envía el formulario; el id y el orden los asigna el sistema. */
export type DatosFotoInicio = Pick<FotoInicio, 'imagen' | 'descripcion' | 'publicada'>;

const RUTA_GESTION = '/portal/manage/home-photos/';

function ordenar(lista: FotoInicio[]): FotoInicio[] {
  return [...lista].sort((a, b) => a.orden - b.orden);
}

function copia(lista: FotoInicio[]): FotoInicio[] {
  return lista.map((foto) => ({ ...foto }));
}

/** Con el permiso `fotos` (#296): la administración por su rol, o quien ella lo encargue. */
function errorDePermiso(usuario: Usuario | null): ErrorApi | null {
  const puede = usuario != null && tienePermiso(usuario, 'fotos');
  return puede ? null : new ErrorApi(403, 'No tienes permiso para cambiar las fotos de Inicio.');
}

/** ¿Publicarla pasaría del máximo? Sin contar la misma foto, si ya estaba publicada. */
function pasaDelMaximo(id: string | undefined): boolean {
  const otras = fotos.filter((foto) => foto.publicada && foto.id !== id);
  return otras.length >= MAXIMO_FOTOS_INICIO;
}

function errorDeValidacion(datos: DatosFotoInicio): ErrorApi | null {
  if (!datos.imagen?.trim()) return new ErrorApi(400, 'Elige la foto.');
  const descripcion = datos.descripcion?.trim() ?? '';
  if (!descripcion) return new ErrorApi(400, 'Escribe qué muestra la foto.');
  if (descripcion.length > LARGO_MAXIMO_DESCRIPCION_FOTO) {
    return new ErrorApi(
      400,
      `La descripción no puede pasar de ${LARGO_MAXIMO_DESCRIPCION_FOTO} caracteres.`,
    );
  }
  return null;
}

/** Las fotos publicadas, en su orden: lo que ve la comunidad en Inicio (CA1). */
export async function obtenerFotosInicio(): Promise<FotoInicio[]> {
  if (!usaApi('fotosInicio')) {
    return simularRed(copia(fotosPublicadas(fotos)));
  }
  const publicadas = await peticion<FotoInicioBackend[]>('/portal/home-photos/');
  return publicadas.map(fotoInicioDesdeBackend);
}

/** Todas las fotos, también las ocultas, para Gestión → Portal → Fotos de Inicio. */
export function obtenerFotosInicioAdministracion(usuario: Usuario): Promise<FotoInicio[]> {
  const sinPermiso = errorDePermiso(usuario);
  if (sinPermiso) return Promise.reject(sinPermiso);
  if (usaApi('fotosInicio')) {
    return peticion<FotoInicioBackend[]>(RUTA_GESTION).then((lista) =>
      lista.map(fotoInicioDesdeBackend),
    );
  }
  return simularRed(copia(ordenar(fotos)));
}

/** Agrega una foto al final (sin id) o edita la que tiene ese id (CA1 y CA5). */
export async function guardarFotoInicio(
  usuario: Usuario,
  datos: DatosFotoInicio,
  id?: string,
): Promise<FotoInicio> {
  const sinPermiso = errorDePermiso(usuario);
  if (sinPermiso) return Promise.reject(sinPermiso);
  if (usaApi('fotosInicio')) {
    const error = errorDeValidacion(datos);
    if (error) throw error;
    const ruta = id ? `${RUTA_GESTION}${encodeURIComponent(id)}/` : RUTA_GESTION;
    const anterior = id ? (await peticion<FotoInicioBackend>(ruta)).image : undefined;
    if (!id && /^https?:/.test(datos.imagen)) {
      throw new ErrorApi(400, 'Selecciona un archivo de imagen.');
    }
    return fotoInicioDesdeBackend(
      await peticion<FotoInicioBackend>(ruta, {
        method: id ? 'PATCH' : 'POST',
        body: await cuerpoFotoInicio(datos, anterior),
      }),
    );
  }
  const error = errorDeValidacion(datos);
  if (error) return Promise.reject(error);
  if (datos.publicada && pasaDelMaximo(id)) {
    return Promise.reject(new ErrorApi(400, MENSAJE_MAXIMO_FOTOS));
  }
  const limpios: DatosFotoInicio = { ...datos, descripcion: datos.descripcion.trim() };
  if (!id) {
    const orden = Math.max(0, ...fotos.map((foto) => foto.orden)) + 1;
    const nueva: FotoInicio = { ...limpios, id: `foto-${Date.now()}-${siguienteId++}`, orden };
    fotos = [...fotos, nueva];
    return simularRed({ ...nueva });
  }
  const anterior = fotos.find((foto) => foto.id === id);
  if (!anterior) return Promise.reject(new ErrorApi(404, 'La foto no existe.'));
  const editada: FotoInicio = { ...anterior, ...limpios, id };
  fotos = fotos.map((foto) => (foto.id === id ? editada : foto));
  return simularRed({ ...editada });
}

/** Publica u oculta una foto (CA2); publicar respeta el máximo (CA4). */
export function cambiarPublicacionFotoInicio(
  usuario: Usuario,
  id: string,
  publicada: boolean,
): Promise<FotoInicio> {
  const sinPermiso = errorDePermiso(usuario);
  if (sinPermiso) return Promise.reject(sinPermiso);
  if (usaApi('fotosInicio')) {
    return peticion<FotoInicioBackend>(`${RUTA_GESTION}${encodeURIComponent(id)}/`, {
      method: 'PATCH',
      body: JSON.stringify({ is_published: publicada }),
    }).then(fotoInicioDesdeBackend);
  }
  const anterior = fotos.find((foto) => foto.id === id);
  if (!anterior) return Promise.reject(new ErrorApi(404, 'La foto no existe.'));
  if (publicada && !anterior.publicada && pasaDelMaximo(id)) {
    return Promise.reject(new ErrorApi(400, MENSAJE_MAXIMO_FOTOS));
  }
  const cambiada: FotoInicio = { ...anterior, publicada };
  fotos = fotos.map((foto) => (foto.id === id ? cambiada : foto));
  return simularRed({ ...cambiada });
}

/** Cambia el orden del carrusel (CA2): los ids en el orden nuevo, la primera arriba. */
export function reordenarFotosInicio(
  usuario: Usuario,
  idsEnOrden: string[],
): Promise<FotoInicio[]> {
  const sinPermiso = errorDePermiso(usuario);
  if (sinPermiso) return Promise.reject(sinPermiso);
  if (usaApi('fotosInicio')) {
    const items = idsEnOrden.map((id, i) => ({ id: Number(id), order: i + 1 }));
    return peticion<FotoInicioBackend[]>(`${RUTA_GESTION}reorder/`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }).then((lista) => lista.map(fotoInicioDesdeBackend));
  }
  const posiciones = new Map(idsEnOrden.map((id, i) => [id, i + 1]));
  fotos = fotos.map((foto) => {
    const orden = posiciones.get(foto.id);
    return orden === undefined ? foto : { ...foto, orden };
  });
  return simularRed(copia(ordenar(fotos)));
}
