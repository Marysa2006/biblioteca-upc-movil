/**
 * Exportación de las estadísticas a PDF (versión 1.1, #259, CA3).
 *
 * Arma un HTML sencillo con los mismos números que la pantalla —los filtros, el total y las
 * tablas por servicio, tipo de usuario, programa, facultad, sede, semestre y el promedio de las
 * calificaciones— y lo convierte a PDF con `expo-print`. Después lo comparte con `expo-sharing`.
 *
 * `expo-print` y `expo-sharing` se importan solo aquí, para que no pesen en el resto.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { ConteoIndicador, FiltrosEstadisticas, IndicadoresUso } from '@/types';
import { hoyISO } from '@/utils/fechas';

/** Nombres legibles de los filtros, en el orden en que se muestran. */
const ETIQUETAS_FILTRO: { clave: keyof FiltrosEstadisticas; titulo: string }[] = [
  { clave: 'desde', titulo: 'Desde' },
  { clave: 'hasta', titulo: 'Hasta' },
  { clave: 'servicio', titulo: 'Servicio' },
  { clave: 'tipoUsuario', titulo: 'Tipo de usuario' },
  { clave: 'programa', titulo: 'Programa' },
  { clave: 'facultad', titulo: 'Facultad' },
  { clave: 'sede', titulo: 'Sede' },
  { clave: 'semestre', titulo: 'Semestre' },
];

/** Escapa el texto que va al HTML: los datos vienen de formularios. */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Una tabla de dos columnas; sin filas, lo dice en vez de dejar un hueco. */
function tabla(titulo: string, filas: ConteoIndicador[]): string {
  const cuerpo = filas.length
    ? filas
        .map(
          (fila) =>
            `<tr><td>${escaparHtml(fila.etiqueta)}</td><td class="n">${fila.cantidad}</td></tr>`,
        )
        .join('')
    : '<tr><td colspan="2" class="vacio">Sin datos en el periodo.</td></tr>';
  return `<section><h2>${escaparHtml(titulo)}</h2><table><tbody>${cuerpo}</tbody></table></section>`;
}

/**
 * El HTML del reporte. Es puro: los mismos indicadores dan el mismo documento, así que se puede
 * comprobar sin abrir el PDF (CA3).
 */
export function htmlDelReporte(indicadores: IndicadoresUso, filtros: FiltrosEstadisticas = {}): string {
  const activos = ETIQUETAS_FILTRO.filter(({ clave }) => {
    const valor = filtros[clave];
    return valor != null && valor !== '' && valor !== 'todos';
  });

  const listaFiltros = activos.length
    ? `<ul>${activos
        .map(({ clave, titulo }) => `<li><b>${titulo}:</b> ${escaparHtml(String(filtros[clave]))}</li>`)
        .join('')}</ul>`
    : '<p class="vacio">Sin filtros: se cuenta todo.</p>';

  const promedio =
    indicadores.calificacionPromedio == null
      ? '<p class="vacio">Todavía nadie ha calificado.</p>'
      : `<p class="promedio">${indicadores.calificacionPromedio.toFixed(1)} de 5</p>`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, Roboto, sans-serif; color: #131B2E; margin: 24px; font-size: 12px; }
  h1 { color: #107B42; font-size: 20px; margin-bottom: 0; }
  .fecha { color: #5B6375; margin-top: 4px; }
  h2 { color: #107B42; font-size: 14px; margin-bottom: 4px; border-bottom: 1px solid #E1E7E1; }
  section { margin-top: 16px; page-break-inside: avoid; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 4px 0; border-bottom: 1px solid #EEF2EE; }
  td.n { text-align: right; font-variant-numeric: tabular-nums; width: 3em; }
  .vacio { color: #5B6375; }
  .total { font-size: 16px; font-weight: bold; }
  .promedio { font-size: 16px; font-weight: bold; }
</style></head>
<body>
  <h1>Estadísticas de uso de la biblioteca</h1>
  <p class="fecha">Generado el ${hoyISO()}.</p>
  <section><h2>Filtros</h2>${listaFiltros}</section>
  <section><h2>Total de operaciones</h2><p class="total">${indicadores.total}</p></section>
  <section><h2>Calificación promedio</h2>${promedio}</section>
  ${tabla('Por servicio', indicadores.porServicio)}
  ${tabla('Por tipo de usuario', indicadores.porTipoUsuario)}
  ${tabla('Por programa', indicadores.porPrograma)}
  ${tabla('Por facultad', indicadores.porFacultad)}
  ${tabla('Por sede', indicadores.porSede)}
  ${tabla('Por semestre', indicadores.porSemestre)}
  ${tabla('Por mes', indicadores.porMes)}
</body></html>`;
}

/**
 * Genera el PDF y abre el menú del sistema para compartirlo. Devuelve si el sistema pudo
 * compartirlo; si no, el archivo queda generado y la pantalla lo dice.
 */
export async function exportarPdf(
  indicadores: IndicadoresUso,
  filtros: FiltrosEstadisticas = {},
): Promise<{ compartido: boolean }> {
  const { uri } = await Print.printToFileAsync({ html: htmlDelReporte(indicadores, filtros) });
  const disponible = await Sharing.isAvailableAsync();
  if (!disponible) {
    return { compartido: false };
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Compartir las estadísticas',
    UTI: 'com.adobe.pdf',
  });
  return { compartido: true };
}
