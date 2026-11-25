/**
 * Exportación de los registros de uso a un CSV (HU-26, CA2).
 * Arma el texto con `registrosACsv()` (puro) y lo guarda en el celular para compartirlo.
 * `expo-sharing` se importa solo aquí, como pide la guía, para que no pese en el resto.
 */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { hoyISO } from '@/utils/fechas';
import { agregarIndicadoresAlCsv, BOM_UTF8, nombreArchivoCsv, registrosACsv, SEPARADOR_CSV } from '@/utils/estadisticas';
import type { FiltrosEstadisticas, IndicadoresUso, RegistroUso } from '@/types';
import { descargarEstadisticas } from '@/api/estadisticas';

async function guardarYCompartirCsv(datos: string) {
  const nombre = nombreArchivoCsv(hoyISO());
  const mimeType = 'text/csv';
  if (typeof document !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const url = URL.createObjectURL(new Blob([datos], { type: mimeType + ';charset=utf-8' }));
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
  if (compartido) {
    await Sharing.shareAsync(archivo.uri, {
      mimeType,
      dialogTitle: 'Compartir las estadísticas',
      UTI: 'public.comma-separated-values-text',
    });
  }
  return { archivo: nombre, compartido };
}

export async function exportarCsvBackend(filtros: FiltrosEstadisticas, indicadores: IndicadoresUso) {
  const respuesta = await descargarEstadisticas(filtros, 'csv');
  const csv = await respuesta.text();
  const texto = csv.startsWith(BOM_UTF8) ? csv : BOM_UTF8 + csv;
  return guardarYCompartirCsv(agregarIndicadoresAlCsv(texto, indicadores, ','));
}

export function exportarRegistrosCsv(registros: RegistroUso[], indicadores: IndicadoresUso) {
  return guardarYCompartirCsv(agregarIndicadoresAlCsv(registrosACsv(registros), indicadores, SEPARADOR_CSV));
}
