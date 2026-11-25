/**
 * Contenidos del portal (HU-04) y el permiso de novedades (versión 1.1, #256).
 *
 * Quién puede publicar qué:
 * - los **avisos** y los **informativos** los publica quien tenga `novedades` o `contenidos`;
 * - los **servicios** siguen siendo solo de `contenidos`: dar novedades no da permiso sobre
 *   los servicios de la biblioteca.
 *
 */
import type { Contenido, Usuario } from '@/types';
import { tienePermiso } from '@/utils/roles';
import { normalizarTexto } from '@/utils/texto';

import {
  contenidoDesdePortal, contenidoGestionDesdeBackend, contenidoHaciaBackend, esNovedad,
  type ContenidoGestionBackend, type ContenidoPortal,
} from './backend/portal';
import { ErrorApi, peticion, peticionTodas, simularRed, usaApi } from './cliente';
import { CONTENIDOS } from './mocks/contenidos';

/** Copia mutable: con mocks, los cambios se ven durante la sesión de la app. */
let contenidos: Contenido[] = CONTENIDOS.map((contenido) => ({ ...contenido }));

/** Datos que envía el formulario; el id y el orden los asigna el sistema. */
export type DatosContenido = Omit<Contenido, 'id' | 'orden'> & { orden?: number };
const RUTA_GESTION = '/portal/manage/contents/';

function listarContenidosBackend() {
  return peticionTodas<ContenidoGestionBackend, ContenidoGestionBackend>(RUTA_GESTION, (contenido) => contenido);
}

async function guardarContenidoBackend(datos: DatosContenido, anterior?: ContenidoGestionBackend) {
  const error = errorDeValidacion(datos);
  if (error) throw error;
  const id = anterior?.slug;
  const slug = id ?? normalizarTexto(datos.titulo).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) throw new ErrorApi(400, 'El título debe incluir letras o números.');
  const resultado = await peticion<ContenidoGestionBackend>(
    id ? `${RUTA_GESTION}${encodeURIComponent(id)}/` : RUTA_GESTION,
    {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify({ ...contenidoHaciaBackend(datos, anterior), slug }),
    },
  );
  return contenidoGestionDesdeBackend(resultado);
}

function ordenar(lista: Contenido[]): Contenido[] {
  return [...lista].sort((a, b) => a.orden - b.orden);
}

/**
 * ¿Esta persona puede publicar este tipo de contenido? (versión 1.1, #256)
 * Los servicios piden `contenidos`; los avisos y los informativos, `novedades` o `contenidos`.
 */
export function puedePublicar(usuario: Usuario | null, tipo: Contenido['tipo']): boolean {
  if (!usuario) return false;
  if (tipo === 'servicio') return tienePermiso(usuario, 'contenidos');
  return tienePermiso(usuario, 'contenidos') || tienePermiso(usuario, 'novedades');
}

/** 403 con el motivo, según lo que le falte a la persona. */
function errorDePermiso(usuario: Usuario | null, tipo: Contenido['tipo']): ErrorApi | null {
  if (puedePublicar(usuario, tipo)) return null;
  return tipo === 'servicio'
    ? new ErrorApi(403, 'Los servicios del portal los publica la administración de la biblioteca.')
    : new ErrorApi(403, 'No tienes el permiso de novedades y avisos.');
}

/** Validación de la HU-04 (CA3): título y descripción son obligatorios. */
function errorDeValidacion(datos: DatosContenido): ErrorApi | null {
  if (!datos.titulo?.trim()) {
    return new ErrorApi(400, 'El título es obligatorio.');
  }
  if (!datos.descripcion?.trim()) {
    return new ErrorApi(400, 'La descripción es obligatoria.');
  }
  return null;
}

export function obtenerContenidos(): Promise<Contenido[]> {
  if (usaApi('contenidos')) return listarContenidosBackend().then((lista) => lista.map(contenidoGestionDesdeBackend));
  return simularRed(ordenar(contenidos).map((contenido) => ({ ...contenido })));
}

/**
 * Avisos e informativos publicados, para Inicio. El portal también lista las páginas (`PAGE`,
 * como `autoarchivo` o `condiciones-tablets`), que no son novedades: se dejan fuera.
 */
export async function obtenerContenidosPublicos(): Promise<Contenido[]> {
  if (!usaApi('contenidos')) return obtenerContenidos();
  const contenidos = await peticionTodas<ContenidoPortal, ContenidoPortal>(
    '/portal/contents/',
    (contenido) => contenido,
  );
  return contenidos.filter(esNovedad).map(contenidoDesdePortal);
}

export function crearContenido(usuario: Usuario, datos: DatosContenido): Promise<Contenido> {
  const sinPermiso = errorDePermiso(usuario, datos.tipo);
  if (sinPermiso) {
    return Promise.reject(sinPermiso);
  }
  if (usaApi('contenidos')) return guardarContenidoBackend(datos);
  const error = errorDeValidacion(datos);
  if (error) {
    return Promise.reject(error);
  }
  const nuevo: Contenido = {
    ...datos,
    id: `con-${Date.now()}`,
    orden: datos.orden ?? contenidos.length + 1,
  };
  contenidos = [...contenidos, nuevo];
  return simularRed({ ...nuevo });
}

export function editarContenido(
  usuario: Usuario,
  id: string,
  datos: DatosContenido,
): Promise<Contenido> {
  if (usaApi('contenidos')) {
    const permiso = errorDePermiso(usuario, datos.tipo);
    if (permiso) return Promise.reject(permiso);
    return peticion<ContenidoGestionBackend>(`${RUTA_GESTION}${encodeURIComponent(id)}/`).then((actual) => {
      const error = errorDePermiso(usuario, contenidoGestionDesdeBackend(actual).tipo);
      if (error) throw error;
      return guardarContenidoBackend(datos, actual);
    });
  }
  // Se comprueba el tipo nuevo y, si existe, el que ya tenía: cambiar un aviso a servicio no
  // puede servir para colarse en los servicios.
  const actual = contenidos.find((contenido) => contenido.id === id);
  const sinPermiso = errorDePermiso(usuario, datos.tipo) ?? errorDePermiso(usuario, actual?.tipo ?? datos.tipo);
  if (sinPermiso) {
    return Promise.reject(sinPermiso);
  }
  const indice = contenidos.findIndex((contenido) => contenido.id === id);
  if (indice === -1) {
    return Promise.reject(new ErrorApi(404, 'El contenido no existe.'));
  }
  const error = errorDeValidacion(datos);
  if (error) {
    return Promise.reject(error);
  }
  contenidos = contenidos.map((contenido, i) =>
    i === indice ? { ...contenido, ...datos, id } : contenido,
  );
  return simularRed({ ...contenidos[indice] });
}

export function cambiarPublicacionContenido(
  usuario: Usuario,
  id: string,
  publicado: boolean,
): Promise<Contenido> {
  if (usaApi('contenidos')) {
    const ruta = `${RUTA_GESTION}${encodeURIComponent(id)}/`;
    return peticion<ContenidoGestionBackend>(ruta).then(async (actual) => {
      const error = errorDePermiso(usuario, contenidoGestionDesdeBackend(actual).tipo);
      if (error) throw error;
      const destino = publicado ? 'publish' : 'hide';
      return contenidoGestionDesdeBackend(await peticion<ContenidoGestionBackend>(
        `${ruta}${destino}/`, { method: 'POST' },
      ));
    });
  }
  const actual = contenidos.find((contenido) => contenido.id === id);
  const sinPermiso = errorDePermiso(usuario, actual?.tipo ?? 'servicio');
  if (sinPermiso) {
    return Promise.reject(sinPermiso);
  }
  const indice = contenidos.findIndex((contenido) => contenido.id === id);
  if (indice === -1) {
    return Promise.reject(new ErrorApi(404, 'El contenido no existe.'));
  }
  contenidos = contenidos.map((contenido, i) =>
    i === indice ? { ...contenido, publicado } : contenido,
  );
  return simularRed({ ...contenidos[indice] });
}

export function reordenarContenidos(usuario: Usuario, idsEnOrden: string[]): Promise<Contenido[]> {
  if (!tienePermiso(usuario, 'contenidos')) {
    return Promise.reject(new ErrorApi(403, 'Solo la administración puede ordenar los contenidos.'));
  }
  if (usaApi('contenidos')) {
    return listarContenidosBackend().then(async (lista) => {
      const ids = new Map(lista.map((contenido) => [contenido.slug, contenido.id]));
      const items = idsEnOrden.map((slug, i) => {
        const id = ids.get(slug);
        if (id === undefined) throw new ErrorApi(404, 'El contenido no existe.');
        return { id, order: i + 1 };
      });
      const ordenados = await peticion<ContenidoGestionBackend[]>(`${RUTA_GESTION}reorder/`, {
        method: 'POST', body: JSON.stringify({ items }),
      });
      return ordenados.map(contenidoGestionDesdeBackend);
    });
  }
  const posiciones = new Map(idsEnOrden.map((id, indice) => [id, indice + 1]));
  contenidos = contenidos.map((contenido) => {
    const orden = posiciones.get(contenido.id);
    return orden === undefined ? contenido : { ...contenido, orden };
  });
  return simularRed(ordenar(contenidos).map((contenido) => ({ ...contenido })));
}
