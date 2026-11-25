/**
 * Exportación de las estadísticas a PDF (versión 1.1, #259, CA3).
 *
 * Arma un HTML sencillo con los mismos números que la pantalla y lo convierte a PDF con
 * `expo-print`; después lo comparte con `expo-sharing`. Desde el #307 va organizado como las
 * pestañas (Resumen, Servicios, Tablets y Calidad), con los filtros en palabras, los porcentajes,
 * los hallazgos clave, el tiempo de respuesta y la duración de los préstamos de tablets.
 * Desde el #310, con el diseño común de los PDF (estilosPdf y encabezadoPdf): logo, márgenes,
 * tarjetas y barras. La constancia de préstamo usa el mismo diseño.
 *
 * `expo-print` y `expo-sharing` se importan solo aquí, para que no pesen en el resto.
 */
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { colores, coloresEstado } from '@/theme';
import { indicadoresDeFinalizacion } from '@/utils/estadisticas';
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
import { LOGO_UPC_PNG_BASE64 } from '@/utils/logoPdf';

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

/**
 * El estilo común de los PDF (#310): página carta con márgenes (en Android, `expo-print` no
 * acepta márgenes por opción: van con @page), tarjetas con borde suave, títulos verdes en
 * mayúsculas pequeñas y el pie con el número de página. Lo usan este reporte y la constancia.
 */
export function estilosPdf(): string {
  return `
  @page { size: letter; margin: 18mm 16mm 20mm;
    @bottom-left { content: "BiblioUPC · Universidad Popular del Cesar"; font: 8.5px Roboto, sans-serif; color: ${colores.textoSecundario}; }
    @bottom-right { content: "Página " counter(page) " de " counter(pages); font: 8.5px Roboto, sans-serif; color: ${colores.textoSecundario}; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Roboto, -apple-system, Arial, sans-serif; color: ${colores.texto}; font-size: 11px; line-height: 1.5; }
  .encabezado { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; padding-bottom: 12px; border-bottom: 3px solid ${colores.primario}; }
  .encabezado img { height: 52px; }
  .encabezado .generado { font-size: 9px; color: ${colores.textoSecundario}; text-align: right; }
  h1 { font-size: 19px; line-height: 1.25; margin: 16px 0 4px; }
  .subtitulo { color: ${colores.textoSecundario}; margin: 0 0 14px; }
  .tarjeta { border: 1px solid ${colores.borde}; border-radius: 10px; padding: 10px 16px 12px; margin-bottom: 10px; page-break-inside: avoid; }
  h3 { display: flex; align-items: center; gap: 8px; font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase; color: ${colores.primario}; margin: 0 0 10px; }
  h3::before { content: ""; width: 4px; height: 12px; border-radius: 2px; background: ${colores.verdeUpc}; }
  .datos { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
  .etq { display: block; color: ${colores.textoSecundario}; font-size: 9px; }
  .val { font-weight: 600; }
  .nota { color: ${colores.textoSecundario}; font-size: 9.5px; margin: -4px 0 8px; }
  .vacio { color: ${colores.textoSecundario}; margin: 0; }
  `;
}

/** «23 de noviembre de 2026». */
function hoyCompleto(): string {
  const hoy = hoyISO();
  return `${fechaLegible(hoy)} de ${hoy.slice(0, 4)}`;
}

/** El encabezado de los PDF (#310): el logo de la UPC, la fecha, el título y una línea. */
export function encabezadoPdf(titulo: string, subtitulo: string): string {
  return `
  <header class="encabezado">
    <img src="data:image/png;base64,${LOGO_UPC_PNG_BASE64}" alt="Universidad Popular del Cesar">
    <div class="generado">Generado el ${hoyCompleto()}</div>
  </header>
  <h1>${escaparHtml(titulo)}</h1>
  <p class="subtitulo">${escaparHtml(subtitulo)}</p>`;
}

/**
 * Un indicador como barras horizontales, con el número y el porcentaje; sin filas, lo dice.
 * `total` es la base del porcentaje (por defecto, la suma de las filas). `color` elige el de
 * cada barra (por estado); si no, el primario.
 */
function barras(
  titulo: string,
  filas: ConteoIndicador[],
  opciones: { total?: number; color?: (etiqueta: string) => string; nota?: string } = {},
): string {
  const base = opciones.total ?? filas.reduce((suma, fila) => suma + fila.cantidad, 0);
  const maximo = Math.max(1, ...filas.map((fila) => fila.cantidad));
  const cuerpo = filas.length
    ? `<table class="barras"><tbody>${filas
        .map((fila) => {
          const ancho = Math.max(2, Math.round((fila.cantidad / maximo) * 100));
          const color = opciones.color?.(fila.etiqueta) ?? colores.primario;
          return (
            `<tr><th>${escaparHtml(fila.etiqueta)}</th>` +
            `<td class="pista"><div class="barra" style="width:${ancho}%;background:${color}"></div></td>` +
            `<td class="num">${fila.cantidad}</td>` +
            `<td class="pct">${textoPorcentaje(fila.cantidad, base)}</td></tr>`
          );
        })
        .join('')}</tbody></table>`
    : '<p class="vacio">Sin datos con estos filtros.</p>';
  const nota = opciones.nota ? `<p class="nota">${escaparHtml(opciones.nota)}</p>` : '';
  return `<div class="tarjeta"><h3>${escaparHtml(titulo)}</h3>${nota}${cuerpo}</div>`;
}

/**
 * Dos tarjetas lado a lado. Con una tabla y no con flex o grid: al imprimir, el motor parte mal
 * esos dos cuando el par cae en un corte de página.
 */
const par = (izquierda: string, derecha: string) =>
  `<table class="par"><tbody><tr><td>${izquierda}</td><td>${derecha}</td></tr></tbody></table>`;

/** Una cifra grande con lo que dice y, si hay, un detalle: «Espacios · Servicio más usado · 9 · 24 %». */
const cifra = (valor: string, etiqueta: string, detalle?: string) =>
  `<div class="cifra"><span class="num">${escaparHtml(valor)}</span>` +
  `<span class="etq">${escaparHtml(etiqueta)}</span>` +
  `${detalle ? `<span class="detalle">${escaparHtml(detalle)}</span>` : ''}</div>`;

/** El título de cada pestaña de la pantalla dentro del reporte. */
const pestana = (titulo: string, descripcion: string) =>
  `<div class="pestana"><h2>${escaparHtml(titulo)}</h2><span>${escaparHtml(descripcion)}</span></div>`;

/** Las barras de Por estado con los colores de los estados de la app. */
const COLOR_ESTADO: Record<string, string> = {
  Finalizada: coloresEstado.realizada.texto,
  Finalizado: coloresEstado.realizada.texto,
  Pendiente: coloresEstado.pendiente.texto,
  Cancelada: coloresEstado.cancelada.texto,
};

/** El tiempo de respuesta de todas las solicitudes respondidas, ponderado por servicio. */
function respuestaPromedio(tiempos: TiempoRespuesta[]): { horas: number; cantidad: number } | null {
  const cantidad = tiempos.reduce((suma, tiempo) => suma + (tiempo.cantidad ?? 0), 0);
  if (cantidad === 0) return null;
  const horas = tiempos.reduce((suma, tiempo) => suma + tiempo.horasPromedio * (tiempo.cantidad ?? 0), 0);
  return { horas: Math.round((horas / cantidad) * 10) / 10, cantidad };
}

/** Resumen: cuatro cifras, los hallazgos clave y las operaciones por mes y por semestre. */
function htmlResumen(indicadores: IndicadoresUso, mostrarUsuariosFrecuentes: boolean): string {
  const { total } = indicadores;
  const servicio = indicadores.porServicio[0];
  const usuarios = mostrarUsuariosFrecuentes ? indicadores.porTipoUsuario[0] : undefined;
  const cierre = indicadoresDeFinalizacion(indicadores);
  const respuesta = respuestaPromedio(indicadores.tiempoRespuesta);
  const detalle = (grupo: ConteoIndicador) =>
    `${grupo.cantidad} · ${textoPorcentaje(grupo.cantidad, total)}`;
  const hallazgos = hallazgosClave(indicadores);

  return (
    pestana('Resumen', 'Lo principal del periodo') +
    `<div class="cifras">${[
      cifra(String(total), 'Operaciones'),
      cifra(servicio?.etiqueta ?? 'Sin datos', 'Servicio más usado', servicio && detalle(servicio)),
      usuarios ? cifra(usuarios.etiqueta, 'Usuarios más frecuentes', detalle(usuarios)) : '',
      cifra(String(cierre.tasaFinalizacion) + ' %', 'Tasa de finalización', String(cierre.finalizadas) + ' finalizadas'),
      cifra(String(cierre.tasaCancelacionesYRechazos) + ' %', 'Cancelaciones y rechazos', String(cierre.noPrestadas) + ' solicitudes sin prestar'),
      cifra(
        respuesta ? textoHoras(respuesta.horas) : 'Sin datos',
        'Respuesta promedio',
        respuesta ? `de ${respuesta.cantidad} solicitudes` : undefined,
      ),
    ].join('')}</div>` +
    (hallazgos.length
      ? `<div class="tarjeta"><h3>Hallazgos clave</h3><ul class="hallazgos">${hallazgos
          .map((frase) => `<li>${escaparHtml(frase)}</li>`)
          .join('')}</ul></div>`
      : '') +
    (indicadores.asistentesPorServicio?.length ? barras('Asistentes por servicio', indicadores.asistentesPorServicio, { total: indicadores.asistentes }) : '') +
    barras('Operaciones por mes', indicadores.porMes, { total }) +
    barras('Operaciones por semestre', periodosEnOrden(indicadores.porPeriodo), { total })
  );
}

/** Servicios: qué se usa, cómo terminó, en qué modalidad, de qué temas y quién lo usa. */
function htmlServicios(indicadores: IndicadoresUso): string {
  const { total } = indicadores;
  return (
    pestana('Servicios', 'Qué se usa, cómo terminó y quién lo usa') +
    barras('Por servicio', indicadores.porServicio, { total }) +
    par(
      barras('Por estado', indicadores.porEstado, {
        total,
        color: (etiqueta) => COLOR_ESTADO[etiqueta] ?? colores.primario,
      }),
      barras('Presencial y virtual', indicadores.porModalidad, { total }),
    ) +
    // Las temáticas, sobre su propio total: el de las asesorías y el de las capacitaciones.
    par(
      barras('Temas de asesoría', indicadores.porTemaAsesoria, {
        nota: 'Sobre el total de asesorías.',
      }),
      barras('Líneas de formación', indicadores.porLineaFormacion, {
        nota: 'Sobre el total de capacitaciones.',
      }),
    ) +
    barras('Por programa', indicadores.porPrograma, { total }) +
    par(
      barras('Por tipo de usuario', indicadores.porTipoUsuario, { total }),
      barras('Por sede', indicadores.porSede, { total }),
    ) +
    barras('Por facultad', indicadores.porFacultad, { total })
  );
}

/** Tablets (#307): los préstamos, su duración, el cumplimiento y los préstamos por mes y programa. */
function htmlTablets(indicadores: IndicadoresUso): string {
  const { tablets } = indicadores;
  const titulo = pestana('Tablets', 'Préstamos, duración y cumplimiento');
  if (tablets.prestamos === 0) {
    return `${titulo}<p class="vacio">No hay préstamos de tablets con estos filtros.</p>`;
  }
  return (
    titulo +
    `<div class="cifras">${[
      cifra(String(tablets.prestamos), 'Préstamos'),
      cifra(
        tablets.duracionPromedio == null ? 'Sin datos' : textoHoras(tablets.duracionPromedio),
        'Duración promedio',
      ),
      cifra(
        tablets.conDuracion === 0
          ? 'Sin datos'
          : textoPorcentaje(tablets.dentroDeReferencia, tablets.conDuracion),
        `Duraron ${tablets.horasReferencia} h o menos`,
        tablets.conDuracion ? `${tablets.dentroDeReferencia} de ${tablets.conDuracion}` : undefined,
      ),
      tablets.sinHoraCompleta != null ? cifra(String(tablets.sinHoraCompleta), 'Sin hora completa', 'Calidad de los datos') : '',
    ].join('')}</div>` +
    barras('Préstamos por mes', tablets.porMes, { total: tablets.prestamos }) +
    barras('Préstamos por programa', tablets.porPrograma, { total: tablets.prestamos })
  );
}

/** Calidad (#307): la calificación, las operaciones sin programa y el tiempo de respuesta. */
function htmlCalidad(indicadores: IndicadoresUso): string {
  const { total } = indicadores;
  const sinPrograma = operacionesSinPrograma(indicadores);
  const tiempos = indicadores.tiempoRespuesta.length
    ? `<div class="envoltura"><table class="tabla"><thead><tr><th>Servicio</th>` +
      `<th class="n">Tiempo promedio</th><th class="n">Solicitudes</th></tr></thead><tbody>${indicadores.tiempoRespuesta
        .map(
          (fila) =>
            `<tr><td>${escaparHtml(fila.etiqueta)}</td>` +
            `<td class="n">${textoHoras(fila.horasPromedio)}</td>` +
            `<td class="n">${fila.cantidad ?? '—'}</td></tr>`,
        )
        .join('')}</tbody></table></div>`
    : '<p class="vacio">Todavía no hay solicitudes respondidas.</p>';
  return (
    pestana('Calidad', 'Del servicio y de los datos') +
    `<div class="cifras dos">${[
      cifra(
        indicadores.calificacionPromedio == null
          ? 'Sin calificaciones'
          : textoCalificacion(indicadores.calificacionPromedio),
        'Calificación promedio',
      ),
      cifra(
        `${sinPrograma} de ${total}`,
        'Sin programa registrado',
        textoPorcentaje(sinPrograma, total),
      ),
    ].join('')}</div>` +
    `<div class="tarjeta"><h3>Tiempo de respuesta</h3>` +
    '<p class="nota">Promedio desde la solicitud hasta la primera respuesta del personal.</p>' +
    `${tiempos}</div>`
  );
}

/**
 * El HTML del reporte, organizado como las pestañas de la pantalla (#307), con el diseño del
 * #310: encabezado con el logo, cifras clave en tarjetas, barras con su número y porcentaje, y
 * las secciones seguidas (sin hojas medio vacías). Es puro: los mismos indicadores dan el mismo
 * documento, así que se puede comprobar sin abrir el PDF (CA3). Los colores salen del tema.
 */
export function htmlDelReporte(
  indicadores: IndicadoresUso,
  filtros: FiltrosEstadisticas = {},
  mostrarUsuariosFrecuentes = true,
): string {
  const activos = filtrosActivos(filtros);
  const chips = activos.length
    ? activos.map((activo) => `<span class="chip">${escaparHtml(activo.texto)}</span>`).join('')
    : '<span class="chip">Sin filtros: todas las operaciones</span>';

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<style>${estilosPdf()}
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin: -6px 0 14px; }
  .chip { padding: 2px 10px; border-radius: 999px; background: ${colores.superficieVariante}; font-size: 9.5px; }
  .cifras { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 10px; page-break-inside: avoid; }
  .cifras.dos { grid-template-columns: 1fr 1fr; }
  .cifra { border-radius: 10px; padding: 10px 12px; background: ${colores.primarioSuave}; }
  .cifra .num { display: block; font-size: 18px; font-weight: 700; color: ${colores.primarioOscuro}; line-height: 1.2; }
  .cifra .etq { color: ${colores.primarioOscuro}; }
  .cifra .detalle { display: block; font-size: 9px; color: ${colores.textoSecundario}; }
  .hallazgos { margin: 0; padding-left: 16px; }
  .hallazgos li { margin-bottom: 4px; }
  .pestana { display: flex; align-items: baseline; gap: 10px; margin: 18px 0 12px; padding-bottom: 6px; border-bottom: 1px solid ${colores.borde}; page-break-after: avoid; }
  .pestana h2 { margin: 0; font-size: 15px; color: ${colores.primarioOscuro}; }
  .pestana span { color: ${colores.textoSecundario}; font-size: 9.5px; }
  .par { width: 100%; border-collapse: separate; border-spacing: 0; page-break-inside: avoid; }
  .par > tbody > tr > td { width: 50%; vertical-align: top; padding: 0; }
  .par > tbody > tr > td:first-child { padding-right: 5px; }
  .par > tbody > tr > td:last-child { padding-left: 5px; }
  .barras { width: 100%; border-collapse: collapse; }
  .barras th { text-align: left; font-weight: 400; width: 38%; padding: 3px 8px 3px 0; }
  .par .barras th { width: 45%; }
  .barras td { padding: 3px 0; vertical-align: middle; }
  .pista { background: linear-gradient(${colores.superficieVariante}, ${colores.superficieVariante}) center / 100% 8px no-repeat; }
  .barra { height: 8px; border-radius: 4px; }
  .barras .num { width: 36px; text-align: right; font-weight: 700; }
  .barras .pct { width: 44px; text-align: right; color: ${colores.textoSecundario}; }
  .envoltura { border-radius: 6px; overflow: hidden; border: 1px solid ${colores.borde}; }
  .tabla { width: 100%; border-collapse: collapse; }
  .tabla th { background: ${colores.primarioOscuro}; color: ${colores.superficie}; text-align: left; padding: 6px 10px; font-weight: 600; }
  .tabla td { padding: 6px 10px; border-top: 1px solid ${colores.borde}; }
  .tabla tr:nth-child(even) td { background: ${colores.fondo}; }
  .tabla .n { text-align: right; font-variant-numeric: tabular-nums; }
</style></head>
<body>
  ${encabezadoPdf('Estadísticas de uso de la biblioteca', 'Reporte de los servicios, con los filtros que se eligieron en la app.')}
  <div class="chips">${chips}</div>
  ${htmlResumen(indicadores, mostrarUsuariosFrecuentes)}
  ${htmlServicios(indicadores)}
  ${htmlTablets(indicadores)}
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
  mostrarUsuariosFrecuentes = true,
): Promise<{ compartido: boolean; impresion?: boolean }> {
  const html = htmlDelReporte(indicadores, filtros, mostrarUsuariosFrecuentes);
  if (typeof document !== 'undefined') {
    // En web, expo-print imprime la pantalla actual. Se imprime el reporte en su propio documento.
    await new Promise<void>((resolver, rechazar) => {
      const marco = document.createElement('iframe');
      marco.style.position = 'fixed';
      marco.style.left = '-10000px';
      marco.style.width = '1px';
      marco.style.height = '1px';
      marco.title = 'Reporte de estadísticas';
      marco.addEventListener('load', () => {
        const ventana = marco.contentWindow;
        if (!ventana) {
          marco.remove();
          rechazar(new Error('No pudimos abrir la vista de impresión.'));
          return;
        }
        ventana.addEventListener('afterprint', () => marco.remove(), { once: true });
        ventana.print();
        resolver();
      }, { once: true });
      marco.srcdoc = html;
      document.body.append(marco);
    });
    return { compartido: false, impresion: true };
  }
  const uri = await guardarPdf(html, 'estadisticas-' + hoyISO() + '.pdf');
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
