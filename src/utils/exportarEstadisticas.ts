/**
 * Exportación de los registros de uso a un CSV (HU-26, CA2).
 * Arma el texto con `registrosACsv()` (puro) y lo guarda en el celular para compartirlo.
 * `expo-sharing` se importa solo aquí, como pide la guía, para que no pese en el resto.
 */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { hoyISO } from '@/utils/fechas';
import { nombreArchivoCsv, registrosACsv } from '@/utils/estadisticas';
import type { RegistroUso } from '@/types';

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
