/**
 * Exportación de las estadísticas a PDF (versión 1.1, #259, CA3).
 *
 * Arma un HTML sencillo con los mismos números que la pantalla y lo convierte a PDF con
 * `expo-print`; después lo comparte con `expo-sharing`. Desde el #307 va organizado como las
 * pestañas (Resumen, Servicios, Tablets y Calidad), con los filtros en palabras, los porcentajes,
 * los hallazgos clave, el tiempo de respuesta y la duración de los préstamos de tablets.
 *
 * `expo-print` y `expo-sharing` se importan solo aquí, para que no pesen en el resto.
 */
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { colores } from '@/theme';
import type {
  ConteoIndicador,
  FiltrosEstadisticas,
  IndicadoresUso,
  TiempoRespuesta,
} from '@/types';
import { fechaLegible, hoyISO } from '@/utils/fechas';
import {
  filtrosActivos,
  hallazgosClave,
  operacionesSinPrograma,
  periodosEnOrden,
  textoCalificacion,
  textoHoras,
  textoPorcentaje,
} from '@/utils/filtrosEstadisticas';

/**
 * Convierte el HTML en un PDF guardado en la caché de la app, con este nombre, y devuelve su URI.
 *
 * `printToFileAsync` deja el PDF en una carpeta de expo-print que la app no puede compartir
 * (Expo Go responde «Not allowed to read file under given URL» en `shareAsync`). Por eso se pide
 * en base64 y se escribe en `Paths.cache`, como el CSV, que sí se comparte. De paso, el archivo
 * lleva un nombre claro en vez de uno aleatorio (#307). Lo usan este reporte y la constancia.
 */
export async function guardarPdf(html: string, nombre: string): Promise<string> {
  const { base64 } = await Print.printToFileAsync({ html, base64: true });
  if (!base64) throw new Error('expo-print no devolvió el contenido del PDF.');
  const archivo = new File(Paths.cache, nombre);
  if (archivo.exists) archivo.delete();
  archivo.create({ intermediates: true });
  archivo.writeSync(base64, { encoding: 'base64' });
  return archivo.uri;
}

/** Escapa el texto que va al HTML: los datos vienen de formularios. */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Una sección con su título y una tabla. */
const seccion = (titulo: string, contenido: string) =>
  `<section><h3>${escaparHtml(titulo)}</h3>${contenido}</section>`;

/** Una tabla de un indicador: el grupo, cuántas y qué parte del total. Sin filas, lo dice. */
function tabla(titulo: string, filas: ConteoIndicador[], total?: number): string {
  const base = total ?? filas.reduce((suma, fila) => suma + fila.cantidad, 0);
  const cuerpo = filas.length
    ? filas
        .map(
          (fila) =>
            `<tr><td>${escaparHtml(fila.etiqueta)}</td><td class="n">${fila.cantidad}</td>` +
            `<td class="n">${textoPorcentaje(fila.cantidad, base)}</td></tr>`,
        )
        .join('')
    : '<tr><td colspan="3" class="vacio">Sin datos con estos filtros.</td></tr>';
  return seccion(titulo, `<table><tbody>${cuerpo}</tbody></table>`);
}

/** Cifras sueltas en dos columnas: «Préstamos · 4», «Duración promedio · 3,2 h». */
function cifras(titulo: string, filas: [string, string][]): string {
  const cuerpo = filas
    .map(
      ([nombre, valor]) =>
        `<tr><td>${escaparHtml(nombre)}</td><td class="v">${escaparHtml(valor)}</td></tr>`,
    )
    .join('');
  return seccion(titulo, `<table><tbody>${cuerpo}</tbody></table>`);
}

/** El tiempo de respuesta por servicio (#307): servicio, tiempo promedio y de cuántas solicitudes. */
function tablaTiempos(tiempos: TiempoRespuesta[]): string {
  const cuerpo = tiempos.length
    ? tiempos
        .map(
          (fila) =>
            `<tr><td>${escaparHtml(fila.etiqueta)}</td>` +
            `<td class="v">${textoHoras(fila.horasPromedio)}</td>` +
            `<td class="n">${fila.cantidad}</td></tr>`,
        )
        .join('')
    : '<tr><td colspan="3" class="vacio">Todavía no hay solicitudes respondidas.</td></tr>';
  return seccion(
    'Tiempo de respuesta',
    '<p class="nota">Promedio desde la solicitud hasta la primera respuesta del personal; ' +
      'la última columna dice de cuántas solicitudes.</p>' +
      `<table><tbody>${cuerpo}</tbody></table>`,
  );
}

/** «Espacios (24 %)», o null si no hay grupo. */
function conPorcentaje(grupo: ConteoIndicador | undefined, total: number): string | null {
  return grupo ? `${grupo.etiqueta} (${textoPorcentaje(grupo.cantidad, total)})` : null;
}

/** Resumen: lo principal, los hallazgos clave y las operaciones por mes y por semestre. */
function htmlResumen(indicadores: IndicadoresUso): string {
  const { total } = indicadores;
  const filas: [string, string][] = [['Operaciones', String(total)]];
  const servicio = conPorcentaje(indicadores.porServicio[0], total);
  if (servicio) filas.push(['Servicio más usado', servicio]);
  const usuarios = conPorcentaje(indicadores.porTipoUsuario[0], total);
  if (usuarios) filas.push(['Usuarios más frecuentes', usuarios]);

  const hallazgos = hallazgosClave(indicadores);
  const listaHallazgos = hallazgos.length
    ? seccion(
        'Hallazgos clave',
        `<ul>${hallazgos.map((frase) => `<li>${escaparHtml(frase)}</li>`).join('')}</ul>`,
      )
    : '';

  return (
    cifras('Lo principal', filas) +
    listaHallazgos +
    tabla('Operaciones por mes', indicadores.porMes, total) +
    tabla('Operaciones por semestre', periodosEnOrden(indicadores.porPeriodo), total)
  );
}

/** Servicios: qué se usa, cómo terminó, en qué modalidad, de qué temas y quién lo usa. */
function htmlServicios(indicadores: IndicadoresUso): string {
  const { total } = indicadores;
  return [
    tabla('Por servicio', indicadores.porServicio, total),
    tabla('Por estado', indicadores.porEstado, total),
    tabla('Presencial y virtual', indicadores.porModalidad, total),
    // Las temáticas, sobre su propio total: el de las asesorías y el de las capacitaciones.
    tabla('Temas de asesoría', indicadores.porTemaAsesoria),
    tabla('Líneas de formación', indicadores.porLineaFormacion),
    tabla('Por programa', indicadores.porPrograma, total),
    tabla('Por tipo de usuario', indicadores.porTipoUsuario, total),
    tabla('Por facultad', indicadores.porFacultad, total),
    tabla('Por sede', indicadores.porSede, total),
  ].join('');
}

/** Tablets (#307): los préstamos, su duración, el cumplimiento y los gráficos por mes y programa. */
function htmlTablets(indicadores: IndicadoresUso): string {
  const { tablets } = indicadores;
  if (tablets.prestamos === 0) {
    return '<p class="vacio">No hay préstamos de tablets con estos filtros.</p>';
  }
  const duracion =
    tablets.duracionPromedio == null ? 'Sin datos' : textoHoras(tablets.duracionPromedio);
  const cumplen =
    tablets.conDuracion === 0
      ? 'Sin datos'
      : `${tablets.dentroDeReferencia} de ${tablets.conDuracion} ` +
        `(${textoPorcentaje(tablets.dentroDeReferencia, tablets.conDuracion)})`;
  return (
    cifras('Préstamos de tablets', [
      ['Préstamos', String(tablets.prestamos)],
      ['Duración promedio', duracion],
      [`Duraron ${tablets.horasReferencia} h o menos`, cumplen],
      ['Sin hora completa', String(tablets.sinHoraCompleta)],
    ]) +
    tabla('Préstamos por mes', tablets.porMes, tablets.prestamos) +
    tabla('Préstamos por programa', tablets.porPrograma, tablets.prestamos)
  );
}

/** Calidad (#307): la calificación, las operaciones sin programa y el tiempo de respuesta. */
function htmlCalidad(indicadores: IndicadoresUso): string {
  const { total } = indicadores;
  const sinPrograma = operacionesSinPrograma(indicadores);
  const calificacion =
    indicadores.calificacionPromedio == null
      ? 'Todavía nadie ha calificado'
      : textoCalificacion(indicadores.calificacionPromedio);
  return (
    cifras('Calidad del servicio y de los datos', [
      ['Calificación promedio', calificacion],
      [
        'Sin programa registrado',
        `${sinPrograma} de ${total} (${textoPorcentaje(sinPrograma, total)})`,
      ],
    ]) + tablaTiempos(indicadores.tiempoRespuesta)
  );
}

/**
 * El HTML del reporte, organizado como las pestañas de la pantalla (#307). Es puro: los mismos
 * indicadores dan el mismo documento, así que se puede comprobar sin abrir el PDF (CA3). Los
 * colores salen del tema.
 */
export function htmlDelReporte(
  indicadores: IndicadoresUso,
  filtros: FiltrosEstadisticas = {},
): string {
  const activos = filtrosActivos(filtros);
  const listaFiltros = activos.length
    ? `<ul>${activos.map((activo) => `<li>${escaparHtml(activo.texto)}</li>`).join('')}</ul>`
    : '<p class="vacio">Sin filtros: todas las operaciones.</p>';

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, Roboto, sans-serif; color: ${colores.texto}; margin: 24px; font-size: 12px; }
  h1 { color: ${colores.primario}; font-size: 20px; margin-bottom: 0; }
  h2 { color: ${colores.superficie}; background: ${colores.primarioOscuro}; font-size: 14px; padding: 6px 8px; margin: 24px 0 0; }
  h3 { color: ${colores.primario}; font-size: 13px; margin-bottom: 4px; border-bottom: 1px solid ${colores.borde}; }
  .fecha, .vacio, .nota { color: ${colores.textoSecundario}; }
  .fecha { margin-top: 4px; }
  .nota { margin: 2px 0 6px; }
  section { margin-top: 12px; page-break-inside: avoid; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 4px 0; border-bottom: 1px solid ${colores.superficieVariante}; }
  td.n { text-align: right; font-variant-numeric: tabular-nums; width: 4em; }
  td.v { text-align: right; font-weight: bold; }
  li { margin-bottom: 4px; }
</style></head>
<body>
  <h1>Estadísticas de uso de la biblioteca</h1>
  <p class="fecha">Generado el ${fechaLegible(hoyISO())}.</p>
  <section><h3>Filtros</h3>${listaFiltros}</section>
  <h2>Resumen</h2>
  ${htmlResumen(indicadores)}
  <h2>Servicios</h2>
  ${htmlServicios(indicadores)}
  <h2>Tablets</h2>
  ${htmlTablets(indicadores)}
  <h2>Calidad</h2>
  ${htmlCalidad(indicadores)}
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
  const uri = await guardarPdf(
    htmlDelReporte(indicadores, filtros),
    `estadisticas-${hoyISO()}.pdf`,
  );
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
