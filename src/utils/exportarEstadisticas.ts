/**
 * Exportación de los registros de uso a un CSV (HU-26, CA2).
 * Arma el texto con `registrosACsv()` (puro) y lo guarda en el celular para compartirlo.
 * `expo-sharing` se importa solo aquí, como pide la guía, para que no pese en el resto.
 */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { hoyISO } from '@/utils/fechas';
import { nombreArchivoCsv, registrosACsv } from '@/utils/estadisticas';
import type { FiltrosEstadisticas, RegistroUso } from '@/types';
import { descargarEstadisticas } from '@/api/estadisticas';

export async function exportarEstadisticasBackend(filtros: FiltrosEstadisticas, formato: 'csv' | 'pdf') {
  const respuesta = await descargarEstadisticas(filtros, formato);
  const datos = new Uint8Array(await respuesta.arrayBuffer());
  const nombre = `estadisticas_${hoyISO()}.${formato}`;
  const mimeType = formato === 'pdf' ? 'application/pdf' : 'text/csv';
  if (typeof document !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const url = URL.createObjectURL(new Blob([datos], { type: mimeType }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombre;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { archivo: nombre, compartido: true };
  }
  const archivo = new File(Paths.cache, nombre);
  archivo.create({ overwrite: true });
  archivo.writeSync(datos);
  const compartido = await Sharing.isAvailableAsync();
  if (compartido) await Sharing.shareAsync(archivo.uri, { mimeType, dialogTitle: 'Compartir las estadísticas' });
  return { archivo: nombre, compartido };
}

/**
 * Guarda los registros como CSV y abre el menú del sistema para compartirlo o enviarlo.
 * Devuelve el nombre del archivo. Si el sistema no puede compartir, lo deja guardado y lo dice.
 */
export async function exportarRegistrosCsv(
  registros: RegistroUso[],
): Promise<{ archivo: string; compartido: boolean }> {
  const nombre = nombreArchivoCsv(hoyISO());
  const archivo = new File(Paths.cache, nombre);
  if (archivo.exists) {
    archivo.delete();
  }
  archivo.create({ intermediates: true });
  // SDK 58: write() es asíncrono; writeSync() deja el archivo listo antes de compartirlo.
  archivo.writeSync(registrosACsv(registros));

  const disponible = await Sharing.isAvailableAsync();
  if (!disponible) {
    return { archivo: nombre, compartido: false };
  }
  await Sharing.shareAsync(archivo.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Compartir las estadísticas',
    UTI: 'public.comma-separated-values-text',
  });
  return { archivo: nombre, compartido: true };
}
