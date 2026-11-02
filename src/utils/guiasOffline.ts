/**
 * Guías guardadas en el celular para leerlas sin conexión (HU-29).
 *
 * Usa expo-file-system (SDK 57): cada guía queda como un JSON en el directorio de
 * documentos de la app (seguro, no lo borra el sistema). En web no hay sistema de
 * archivos; ahí se usa memoria, solo para no romper la app de desarrollo.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { Guia, GuiaGuardada } from '@/types';

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

/** Guarda o actualiza una guía en el celular (CA2 y CA3). */
export function guardarGuia(guia: Guia): void {
  const guardada: GuiaGuardada = { guia, guardadaEn: Date.now() };
  if (esWeb()) {
    memoriaWeb.set(guia.id, guardada);
    return;
  }
  asegurarCarpeta();
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

/** Borra una guía guardada (para liberar espacio). */
export function eliminarGuia(id: string): void {
  if (esWeb()) {
    memoriaWeb.delete(id);
    return;
  }
  const archivo = archivoDe(id);
  if (archivo.exists) {
    archivo.delete();
  }
}

/** Ids de las guías guardadas, para distinguirlas en la lista (CA2). */
export function idsGuardadas(): string[] {
  if (esWeb()) return [...memoriaWeb.keys()];
  const carpeta = carpetaGuias();
  if (!carpeta.exists) {
    return [];
  }
  return carpeta
    .list()
    .filter((elemento): elemento is File => elemento instanceof File)
    .map((archivo) => archivo.name.replace(/\.json$/, ''));
}
