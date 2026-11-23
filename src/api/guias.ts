/**
 * Guías de la biblioteca (HU-29, función plus).
 * Solo se ofrecen las guías publicadas (CA1). La app las guarda en el celular para
 * leerlas sin conexión; la versión nueva la sigue publicando el Backend.
 *
 * Versión 1.1 (#258): la biblioteca publica sus guías desde Gestión → Portal → Guías.
 * - Las publica quien tenga el permiso `contenidos` o `novedades` (403 en los demás casos).
 * - Una guía lleva un enlace (Drive o una página) o el contenido escrito aquí; el enlace tiene que
 *   ser `https` (400 si no).
 * - Desde el #303, también su PDF (hasta 10 MB). Al crear o editar con un PDF nuevo, la petición
 *   va como `multipart/form-data` con el archivo en `archivo`; sin PDF nuevo, como JSON. El
 *   Backend todavía no tiene guías: los nombres de los campos son provisionales.
 *
 * Las rutas son provisionales: confírmenlas con el equipo de Backend.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { ArchivoGuia, Guia, Usuario } from '@/types';
import { enlaceValido } from '@/utils/agenda';
import { hoyISO } from '@/utils/fechas';
import { esArchivoLocal, problemaArchivoGuia, type DatosGuia } from '@/utils/guias';
import { tienePermiso } from '@/utils/roles';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { GUIAS } from './mocks/guias';

/** Copia mutable: con mocks, los cambios se ven durante la sesión de la app. */
let guias: Guia[] = GUIAS.map((guia) => ({ ...guia }));

/**
 * Lo que envía el formulario (utils/guias): `enlace: null` borra el enlace (#297) y
 * `archivo: null`, el PDF (#303).
 */
export type { DatosGuia };

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

/** Título y descripción obligatorios; el PDF (#303), un enlace `https` o el contenido escrito. */
function errorDeValidacion(datos: DatosGuia): ErrorApi | null {
  if (!datos.titulo?.trim()) return new ErrorApi(400, 'El título es obligatorio.');
  if (!datos.descripcion?.trim()) return new ErrorApi(400, 'La descripción es obligatoria.');
  if (datos.archivo != null) {
    const problema = problemaArchivoGuia(datos.archivo);
    if (problema) return new ErrorApi(400, problema);
  } else if (datos.enlace != null) {
    if (!enlaceValido(datos.enlace)) {
      return new ErrorApi(400, 'El enlace de la guía tiene que empezar por https://.');
    }
  } else if (!datos.contenido?.trim()) {
    return new ErrorApi(400, 'Sube el PDF de la guía, pon su enlace o escribe su contenido.');
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

/** Carpeta que hace de servidor con los datos de prueba: ahí quedan los PDF «subidos» (#303). */
const CARPETA_SERVIDOR = 'servidor-guias';

/**
 * Con mocks, el PDF elegido se copia a la carpeta del «servidor»: el que entrega el selector de
 * archivos puede ser una copia temporal. Si reemplaza a otro, el anterior se borra.
 */
function subirPdfSimulado(archivo: ArchivoGuia, id: string, anterior?: ArchivoGuia): ArchivoGuia {
  if (Platform.OS === 'web' || archivo.url === anterior?.url) return archivo;
  const carpeta = new Directory(Paths.document, CARPETA_SERVIDOR);
  if (!carpeta.exists) carpeta.create({ intermediates: true, idempotent: true });
  const destino = new File(carpeta, `${id}-${Date.now()}.pdf`);
  new File(archivo.url).copySync(destino);
  if (anterior) {
    const viejo = new File(anterior.url);
    if (viejo.uri.includes(CARPETA_SERVIDOR) && viejo.exists) viejo.delete();
  }
  return { ...archivo, url: destino.uri };
}

/**
 * El cuerpo de la petición real. Con un PDF recién elegido, `multipart/form-data`: los campos
 * como texto y el archivo en `archivo` (el `enlace` vacío lo borra). Sin PDF nuevo, JSON: el PDF
 * ya subido no se manda (se conserva) y `archivo: null` lo borra.
 */
function cuerpoGuia(datos: DatosGuia): string | FormData {
  const { archivo, ...resto } = datos;
  if (archivo && esArchivoLocal(archivo)) {
    const formulario = new FormData();
    formulario.append('titulo', resto.titulo);
    formulario.append('descripcion', resto.descripcion);
    formulario.append('contenido', '');
    formulario.append('enlace', '');
    formulario.append('publicado', String(resto.publicado));
    // React Native sube un archivo local con { uri, name, type }.
    formulario.append('archivo', {
      uri: archivo.url,
      name: archivo.nombre,
      type: 'application/pdf',
    } as unknown as Blob);
    return formulario;
  }
  return JSON.stringify(archivo === null ? { ...resto, archivo: null } : resto);
}

/** Crea una guía (sin id) o edita la que tiene ese id (#258; con PDF, #303). */
export function guardarGuia(usuario: Usuario, datos: DatosGuia, id?: string): Promise<Guia> {
  const sinPermiso = errorDePermiso(usuario);
  if (sinPermiso) return Promise.reject(sinPermiso);
  if (USAR_MOCKS) {
    const error = errorDeValidacion(datos);
    if (error) return Promise.reject(error);
    const actualizada = hoyISO();
    try {
      if (!id) {
        const nuevoId = `guia-${Date.now()}`;
        const nueva: Guia = {
          ...datos,
          enlace: datos.enlace ?? undefined,
          archivo: datos.archivo ? subirPdfSimulado(datos.archivo, nuevoId) : undefined,
          id: nuevoId,
          actualizada,
        };
        guias = [...guias, nueva];
        return simularRed({ ...nueva });
      }
      const indice = guias.findIndex((guia) => guia.id === id);
      if (indice === -1) return Promise.reject(new ErrorApi(404, 'La guía no existe.'));
      const anterior = guias[indice];
      // `null` quita el enlace (#297) o el PDF (#303): la guía cambió de formato. La API real
      // recibe el null.
      const editada: Guia = {
        ...anterior,
        ...datos,
        enlace: datos.enlace ?? undefined,
        archivo: datos.archivo ? subirPdfSimulado(datos.archivo, id, anterior.archivo) : undefined,
        id,
        actualizada,
      };
      guias = guias.map((guia, i) => (i === indice ? editada : guia));
      return simularRed({ ...editada });
    } catch {
      return Promise.reject(new ErrorApi(400, 'No pudimos leer el PDF. Elígelo otra vez.'));
    }
  }
  const body = cuerpoGuia(datos);
  return id
    ? peticion<Guia>(`/guias/${id}/`, { method: 'PUT', body })
    : peticion<Guia>('/guias/', { method: 'POST', body });
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
