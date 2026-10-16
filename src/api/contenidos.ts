/**
 * Contenidos del portal (HU-04).
 * Lista, crea, edita, publica/oculta y reordena los contenidos informativos y avisos.
 * Las rutas son provisionales: confírmenlas con el equipo de Backend.
 */
import type { Contenido } from '@/types';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { CONTENIDOS } from './mocks/contenidos';

/** Copia mutable: con mocks, los cambios se ven durante la sesión de la app. */
let contenidos: Contenido[] = CONTENIDOS.map((contenido) => ({ ...contenido }));

/** Datos que envía el formulario; el id y el orden los asigna el sistema. */
export type DatosContenido = Omit<Contenido, 'id' | 'orden'> & { orden?: number };

function ordenar(lista: Contenido[]): Contenido[] {
  return [...lista].sort((a, b) => a.orden - b.orden);
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
  if (USAR_MOCKS) {
    return simularRed(ordenar(contenidos).map((contenido) => ({ ...contenido })));
  }
  return peticion<Contenido[]>('/contenidos/');
}

export function crearContenido(datos: DatosContenido): Promise<Contenido> {
  if (USAR_MOCKS) {
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
  return peticion<Contenido>('/contenidos/', { method: 'POST', body: JSON.stringify(datos) });
}

export function editarContenido(id: string, datos: DatosContenido): Promise<Contenido> {
  if (USAR_MOCKS) {
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
  return peticion<Contenido>(`/contenidos/${id}/`, { method: 'PUT', body: JSON.stringify(datos) });
}

export function cambiarPublicacionContenido(id: string, publicado: boolean): Promise<Contenido> {
  if (USAR_MOCKS) {
    const indice = contenidos.findIndex((contenido) => contenido.id === id);
    if (indice === -1) {
      return Promise.reject(new ErrorApi(404, 'El contenido no existe.'));
    }
    contenidos = contenidos.map((contenido, i) =>
      i === indice ? { ...contenido, publicado } : contenido,
    );
    return simularRed({ ...contenidos[indice] });
  }
  return peticion<Contenido>(`/contenidos/${id}/publicacion/`, {
    method: 'PATCH',
    body: JSON.stringify({ publicado }),
  });
}

export function reordenarContenidos(idsEnOrden: string[]): Promise<Contenido[]> {
  if (USAR_MOCKS) {
    const posiciones = new Map(idsEnOrden.map((id, indice) => [id, indice + 1]));
    contenidos = contenidos.map((contenido) => {
      const orden = posiciones.get(contenido.id);
      return orden === undefined ? contenido : { ...contenido, orden };
    });
    return simularRed(ordenar(contenidos).map((contenido) => ({ ...contenido })));
  }
  return peticion<Contenido[]>('/contenidos/orden/', {
    method: 'PATCH',
    body: JSON.stringify({ ids: idsEnOrden }),
  });
}
