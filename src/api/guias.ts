/**
 * Guías de la biblioteca (HU-29, función plus).
 * Solo se ofrecen las guías publicadas (CA1). La app las guarda en el celular para
 * leerlas sin conexión; la versión nueva la sigue publicando el Backend.
 *
 * Versión 1.1 (#258): la biblioteca publica sus guías desde Gestión → Portal → Guías.
 * - Las publica quien tenga el permiso `contenidos` o `novedades` (403 en los demás casos).
 * - Una guía lleva un enlace (PDF o Drive) o el contenido escrito aquí; el enlace tiene que
 *   ser `https` (400 si no).
 *
 * Las rutas son provisionales: confírmenlas con el equipo de Backend.
 */
import type { Guia, Usuario } from '@/types';
import { enlaceValido } from '@/utils/agenda';
import { hoyISO } from '@/utils/fechas';
import { tienePermiso } from '@/utils/roles';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { GUIAS } from './mocks/guias';

/** Copia mutable: con mocks, los cambios se ven durante la sesión de la app. */
let guias: Guia[] = GUIAS.map((guia) => ({ ...guia }));

/** Lo que envía el formulario; el id y la fecha de actualización los asigna el sistema. */
export type DatosGuia = Omit<Guia, 'id' | 'actualizada'>;

/** ¿Esta persona puede publicar guías? (#258): con `contenidos` o `novedades`. */
export function puedeGestionarGuias(usuario: Usuario | null): boolean {
  if (!usuario) return false;
  return tienePermiso(usuario, 'contenidos') || tienePermiso(usuario, 'novedades');
}

function errorDePermiso(usuario: Usuario | null): ErrorApi | null {
  return puedeGestionarGuias(usuario)
    ? null
    : new ErrorApi(403, 'No tienes permiso para publicar guías de la biblioteca.');
}

/** Título y descripción obligatorios; un enlace `https` o el contenido escrito. */
function errorDeValidacion(datos: DatosGuia): ErrorApi | null {
  if (!datos.titulo?.trim()) return new ErrorApi(400, 'El título es obligatorio.');
  if (!datos.descripcion?.trim()) return new ErrorApi(400, 'La descripción es obligatoria.');
  if (datos.enlace != null) {
    if (!enlaceValido(datos.enlace)) {
      return new ErrorApi(400, 'El enlace de la guía tiene que empezar por https://.');
    }
  } else if (!datos.contenido?.trim()) {
    return new ErrorApi(400, 'Escribe el contenido de la guía o pon su enlace.');
  }
  return null;
}

/** Guías publicadas, para la sección de guías de la comunidad (CA1). */
export function obtenerGuias(): Promise<Guia[]> {
  if (USAR_MOCKS) {
    return simularRed(guias.filter((guia) => guia.publicado).map((guia) => ({ ...guia })));
  }
  return peticion<Guia[]>('/guias/');
}

/** Detalle de una guía publicada. Falla con 404 si no existe o no está publicada. */
export function obtenerGuia(id: string): Promise<Guia> {
  if (USAR_MOCKS) {
    const guia = guias.find((g) => g.id === id && g.publicado);
    if (!guia) {
      return Promise.reject(new ErrorApi(404, `No existe la guía ${id}`));
    }
    return simularRed({ ...guia });
  }
  return peticion<Guia>(`/guias/${id}/`);
}

/** Todas las guías, también las no publicadas, para Gestión → Portal → Guías (#258). */
export function obtenerGuiasAdministracion(usuario: Usuario): Promise<Guia[]> {
  const sinPermiso = errorDePermiso(usuario);
  if (sinPermiso) return Promise.reject(sinPermiso);
  if (USAR_MOCKS) {
    return simularRed(guias.map((guia) => ({ ...guia })));
  }
  return peticion<Guia[]>('/guias/administracion/');
}

/** Crea una guía (sin id) o edita la que tiene ese id (#258). */
export function guardarGuia(usuario: Usuario, datos: DatosGuia, id?: string): Promise<Guia> {
  const sinPermiso = errorDePermiso(usuario);
  if (sinPermiso) return Promise.reject(sinPermiso);
  if (USAR_MOCKS) {
    const error = errorDeValidacion(datos);
    if (error) return Promise.reject(error);
    const actualizada = hoyISO();
    if (!id) {
      const nueva: Guia = { ...datos, id: `guia-${Date.now()}`, actualizada };
      guias = [...guias, nueva];
      return simularRed({ ...nueva });
    }
    const indice = guias.findIndex((guia) => guia.id === id);
    if (indice === -1) return Promise.reject(new ErrorApi(404, 'La guía no existe.'));
    // `enlace` sin valor también se quita: la guía pasó a ser escrita.
    const editada: Guia = { ...guias[indice], ...datos, enlace: datos.enlace, id, actualizada };
    guias = guias.map((guia, i) => (i === indice ? editada : guia));
    return simularRed({ ...editada });
  }
  return id
    ? peticion<Guia>(`/guias/${id}/`, { method: 'PUT', body: JSON.stringify(datos) })
    : peticion<Guia>('/guias/', { method: 'POST', body: JSON.stringify(datos) });
}

/** Publica o despublica una guía (#258, CA2). */
export function cambiarPublicacionGuia(
  usuario: Usuario,
  id: string,
  publicado: boolean,
): Promise<Guia> {
  const sinPermiso = errorDePermiso(usuario);
  if (sinPermiso) return Promise.reject(sinPermiso);
  if (USAR_MOCKS) {
    const indice = guias.findIndex((guia) => guia.id === id);
    if (indice === -1) return Promise.reject(new ErrorApi(404, 'La guía no existe.'));
    const cambiada: Guia = { ...guias[indice], publicado };
    guias = guias.map((guia, i) => (i === indice ? cambiada : guia));
    return simularRed({ ...cambiada });
  }
  return peticion<Guia>(`/guias/${id}/publicacion/`, {
    method: 'PATCH',
    body: JSON.stringify({ publicado }),
  });
}
