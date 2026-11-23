/**
 * Guías guardadas en el celular para leerlas sin conexión (HU-29).
 *
 * Usa expo-file-system (SDK 58): cada guía queda como un JSON en el directorio de
 * documentos de la app (seguro, no lo borra el sistema). En web no hay sistema de
 * archivos; ahí se usa memoria, solo para no romper la app de desarrollo.
 *
 * Versión 1.1 (#303):
 * - Una guía en PDF guarda también su archivo, `<id>.pdf`, al lado del JSON. Se descarga solo si
 *   cambió (otra fecha de actualización u otro archivo) o si falta.
 * - Las guías con enlace no se guardan: no hay nada que leer sin conexión. Si había una copia de
 *   cuando la guía era escrita o PDF, se borra.
 */
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { ArchivoGuia, Guia, GuiaGuardada } from '@/types';
import { esArchivoLocal, NOMBRE_PDF_ELEGIDO } from '@/utils/guias';

const CARPETA = 'guias';

/** Respaldo en memoria para la web (desarrollo). */
const memoriaWeb = new Map<string, GuiaGuardada>();

function esWeb(): boolean {
  return Platform.OS === 'web';
}

function carpetaGuias(): Directory {
  return new Directory(Paths.document, CARPETA);
}

function archivoDe(id: string): File {
  return new File(carpetaGuias(), `${id}.json`);
}

/** El PDF guardado de una guía (#303). */
function pdfDe(id: string): File {
  return new File(carpetaGuias(), `${id}.pdf`);
}

function asegurarCarpeta(): void {
  const carpeta = carpetaGuias();
  if (!carpeta.exists) {
    carpeta.create({ intermediates: true, idempotent: true });
  }
}

/** ¿La guía está guardada en el celular? */
export function estaGuardada(id: string): boolean {
  if (esWeb()) return memoriaWeb.has(id);
  return archivoDe(id).exists;
}

/**
 * Descarga el PDF de la guía al celular, salvo que la copia ya tenga ese mismo archivo (#303).
 * Con los datos de prueba el archivo es local y se copia. Si la descarga falla, no deja un archivo
 * a medias.
 */
async function guardarPdf(guia: Guia): Promise<void> {
  const archivo = guia.archivo;
  if (!archivo) return;
  const destino = pdfDe(guia.id);
  const anterior = leerGuiaGuardada(guia.id)?.guia;
  const alDia =
    destino.exists &&
    anterior?.actualizada === guia.actualizada &&
    anterior.archivo?.url === archivo.url;
  if (alDia) return;

  if (destino.exists) destino.delete();
  try {
    if (esArchivoLocal(archivo)) {
      new File(archivo.url).copySync(destino);
    } else {
      await File.downloadFileAsync(archivo.url, destino, { idempotent: true });
    }
  } catch (error) {
    if (destino.exists) destino.delete();
    throw error;
  }
}

/**
 * Guarda o actualiza una guía en el celular (CA2 y CA3). Con PDF, primero el archivo y después el
 * JSON: así, si el JSON está, el PDF también (#303). Las guías con enlace no se guardan.
 */
export async function guardarGuia(guia: Guia): Promise<void> {
  if (guia.enlace && !guia.archivo) {
    eliminarGuia(guia.id);
    return;
  }
  const guardada: GuiaGuardada = { guia, guardadaEn: Date.now() };
  if (esWeb()) {
    memoriaWeb.set(guia.id, guardada);
    return;
  }
  asegurarCarpeta();
  if (guia.archivo) {
    await guardarPdf(guia);
  } else if (pdfDe(guia.id).exists) {
    // Antes era un PDF y ahora es escrita.
    pdfDe(guia.id).delete();
  }
  const archivo = archivoDe(guia.id);
  if (!archivo.exists) {
    archivo.create({ intermediates: true });
  }
  // SDK 58: write() pasó a ser asíncrono; writeSync() conserva el guardado inmediato.
  archivo.writeSync(JSON.stringify(guardada));
}

/** Lee una guía guardada; null si no está en el celular. */
export function leerGuiaGuardada(id: string): GuiaGuardada | null {
  if (esWeb()) return memoriaWeb.get(id) ?? null;
  const archivo = archivoDe(id);
  if (!archivo.exists) {
    return null;
  }
  try {
    return JSON.parse(archivo.textSync()) as GuiaGuardada;
  } catch {
    return null;
  }
}

/**
 * El PDF guardado de una guía, para abrirlo con el visor del sistema (#303); null si no está.
 * En web no hay copia ni visor: la pantalla abre el archivo de la guía en el navegador.
 */
export function pdfGuardado(guia: Pick<Guia, 'id' | 'archivo'>): File | null {
  if (!guia.archivo || esWeb()) return null;
  const pdf = pdfDe(guia.id);
  return pdf.exists ? pdf : null;
}

/** Borra una guía guardada (para liberar espacio), con su PDF si lo tiene (#303). */
export function eliminarGuia(id: string): void {
  if (esWeb()) {
    memoriaWeb.delete(id);
    return;
  }
  for (const archivo of [archivoDe(id), pdfDe(id)]) {
    if (archivo.exists) {
      archivo.delete();
    }
  }
}

/** Ids de las guías guardadas, para distinguirlas en la lista (CA2). Solo cuentan los JSON. */
export function idsGuardadas(): string[] {
  if (esWeb()) return [...memoriaWeb.keys()];
  const carpeta = carpetaGuias();
  if (!carpeta.exists) {
    return [];
  }
  return carpeta
    .list()
    .filter((elemento): elemento is File => elemento instanceof File)
    .filter((archivo) => archivo.name.endsWith('.json'))
    .map((archivo) => archivo.name.replace(/\.json$/, ''));
}

/**
 * Abre el selector de archivos del sistema para elegir el PDF de una guía (#303); null si la
 * persona lo cancela. No valida: el formulario dice si el archivo sirve (problemaArchivoGuia).
 *
 * En Android el selector entrega una referencia `content://…/msf:2342`: `File.name` da ese final y
 * no el nombre real, y no hay forma de leerlo. Por eso el PDF se reconoce por su tipo
 * (`application/pdf`), y si el nombre no sirve se usa NOMBRE_PDF_ELEGIDO; al guardar, la guía le
 * pone su título (datosDeGuia).
 */
export async function elegirPdfGuia(): Promise<ArchivoGuia | null> {
  const elegido = await File.pickFileAsync({ mimeTypes: 'application/pdf' });
  if (elegido.canceled) return null;
  const archivo = elegido.result;
  const conNombre = /\.pdf$/i.test(archivo.name);
  let nombre = archivo.name;
  if (!conNombre && archivo.type === 'application/pdf') nombre = NOMBRE_PDF_ELEGIDO;
  return { url: archivo.uri, nombre, bytes: archivo.size };
}

/**
 * Abre el PDF guardado de una guía con el visor del sistema (#303): en Android, la app de PDF del
 * celular; en iOS, Vista rápida. Si el celular no tiene con qué abrirlo, ofrece «Abrir con…»
 * (expo-sharing). Funciona sin conexión: el archivo ya está en el celular. Falla si no hay copia.
 */
export async function abrirPdfGuardado(
  guia: Pick<Guia, 'id' | 'titulo' | 'archivo'>,
): Promise<void> {
  const pdf = pdfGuardado(guia);
  if (!pdf) throw new Error('El PDF de la guía no está guardado en el celular.');
  const opciones = { mimeType: 'application/pdf' };
  let conVisor = false;
  try {
    conVisor = await File.canPreview(pdf, opciones);
  } catch {
    conVisor = false;
  }
  if (conVisor) {
    await File.preview(pdf, { ...opciones, title: guia.titulo });
    return;
  }
  await Sharing.shareAsync(pdf.uri, { ...opciones, dialogTitle: guia.titulo });
}
