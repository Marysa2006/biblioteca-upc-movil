/**
 * La constancia del préstamo de tablet en PDF (versión 1.1, #253): el mismo contenido que se ve
 * en la app, en el orden del formato, convertido con `expo-print` y compartido con `expo-sharing`.
 * Los dos se importan solo aquí, como en exportarPdf.ts, para que no pesen en el resto.
 *
 * #310: con el diseño común de los PDF (logo, márgenes y tarjetas) y en una sola hoja, como el
 * papel. "Para constancia de lo anterior firman" lleva los tres recuadros (firmasDeConstancia):
 * - el usuario responsable, con el trazo de su firma en la pantalla, o en blanco si firma en papel;
 * - quien entrega y quien recibe, "Firmado electrónicamente" con su sesión y la hora;
 * - lo que todavía no se sabe, con una línea para escribirlo a mano.
 * Al pie, el código de verificación (codigoVerificacion): si cambia un dato, cambia el código.
 */
import * as Sharing from 'expo-sharing';

import { colores } from '@/theme';
import { encabezadoPdf, escaparHtml, estilosPdf, guardarPdf } from '@/utils/exportarPdf';
import {
  codigoVerificacion,
  esFirmaValida,
  fechaHoraLegible,
  firmasDeConstancia,
  type ConstanciaPrestamo,
  type DatoConstancia,
  type FirmaConstancia,
} from '@/utils/prestamos';

const dato = (valor: DatoConstancia) =>
  `<div><span class="etq">${escaparHtml(valor.etiqueta)}</span>` +
  `<span class="val">${escaparHtml(valor.valor)}</span></div>`;

/** La firma de un recuadro: el trazo, el texto de la firma con sesión, o el espacio en blanco. */
function espacioFirma(firma: FirmaConstancia['firma']): string {
  if (firma?.tipo === 'trazo' && esFirmaValida(firma.firma)) {
    const { trazo, ancho, alto, fechaHora } = firma.firma;
    return (
      `<div class="espacio con-trazo"><svg viewBox="0 0 ${ancho} ${alto}" preserveAspectRatio="xMidYMid meet">` +
      `<path d="${trazo}" fill="none" stroke="${colores.texto}" stroke-width="2.5" ` +
      'stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      `<p class="pie">Firmado electrónicamente en la app el ${escaparHtml(fechaHoraLegible(fechaHora))}</p>`
    );
  }
  if (firma?.tipo === 'sesion') {
    return (
      '<div class="espacio con-sesion"><span>Firmado electrónicamente con su cuenta institucional</span></div>' +
      `<p class="pie">${escaparHtml(fechaHoraLegible(firma.fechaHora))}</p>`
    );
  }
  return '<div class="espacio"></div><p class="pie">Firma</p>';
}

/** Un recuadro de firma, como celda de la tabla: sus datos (o una línea) y la firma. */
function recuadroFirma(firma: FirmaConstancia): string {
  const datos = firma.datos
    .map(
      (valor) =>
        `<p><span class="etq">${escaparHtml(valor.etiqueta)}</span>` +
        `${valor.valor ? `<span class="val">${escaparHtml(valor.valor)}</span>` : '<span class="linea"></span>'}</p>`,
    )
    .join('');
  return `<td><h4>${escaparHtml(firma.titulo)}</h4><div class="datos-firma">${datos}</div>${espacioFirma(firma.firma)}</td>`;
}

/** El HTML de la constancia. Es puro: la misma constancia da el mismo documento. */
export function htmlDeConstancia(constancia: ConstanciaPrestamo): string {
  const firmas = firmasDeConstancia(constancia).map(recuadroFirma).join('');
  const notas = constancia.notasLegales.map((nota) => `<li>${escaparHtml(nota)}</li>`).join('');
  const aparte = (texto: string) => `<p class="aparte">${texto}</p>`;

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<style>${estilosPdf()}
  .franja { display: flex; align-items: stretch; border-radius: 10px; background: ${colores.primarioSuave}; margin-bottom: 10px; page-break-inside: avoid; }
  .franja > div { flex: 1; padding: 10px 16px; }
  .franja .etq { color: ${colores.primarioOscuro}; text-transform: uppercase; letter-spacing: .08em; }
  .franja .val { font-size: 14px; font-weight: 700; }
  .franja .flecha { flex: 0; align-self: center; color: ${colores.primario}; font-size: 18px; padding: 0; }
  .estado { display: inline-block; padding: 1px 10px; border-radius: 999px; background: ${colores.primarioSuave}; color: ${colores.primarioOscuro}; font-weight: 700; }
  .aparte { margin: 10px 0 0; padding-top: 8px; border-top: 1px dashed ${colores.borde}; color: ${colores.textoSecundario}; font-size: 9.5px; }
  /* Una tabla y no flex: los tres recuadros quedan del mismo alto y no se parten al imprimir. */
  .firmas { width: calc(100% + 20px); border-collapse: separate; border-spacing: 10px 0; margin: 0 -10px; }
  .firmas td { width: 33.3%; vertical-align: top; border: 1px solid ${colores.bordeFuerte}; border-radius: 8px; padding: 10px 12px 6px; }
  .firmas h4 { margin: 0 0 6px; font-size: 10px; }
  .firmas p { margin: 3px 0; }
  .datos-firma { min-height: 66px; }
  .linea { display: block; height: 16px; border-bottom: 1px solid ${colores.borde}; }
  .espacio { height: 52px; border-bottom: 1px solid ${colores.texto}; margin-top: 4px; }
  .espacio svg { width: 100%; height: 100%; }
  .con-sesion { display: flex; align-items: flex-end; padding-bottom: 4px; color: ${colores.primarioOscuro}; font-size: 9.5px; font-weight: 600; }
  .pie { text-align: center; color: ${colores.textoSecundario}; font-size: 8.5px; margin-top: 2px !important; }
  .notas { font-size: 8.5px; line-height: 1.45; color: ${colores.textoSecundario}; padding: 8px 0 0 16px; margin: 4px 0 0; border-top: 1px solid ${colores.borde}; }
  .notas li { margin-bottom: 2px; }
  .verificacion { margin: 8px 0 0; font-size: 8.5px; color: ${colores.textoSecundario}; }
  .verificacion b { color: ${colores.texto}; letter-spacing: .06em; }
</style></head>
<body>
  ${encabezadoPdf('Formato de responsabilidad sobre el préstamo', 'Préstamo de tablet de la Biblioteca')}
  <div class="franja">
    <div><span class="etq">Préstamo</span><span class="val">${escaparHtml(fechaHoraLegible(constancia.prestamo))}</span></div>
    <div class="flecha">→</div>
    <div><span class="etq">${constancia.recibio ? 'Devolución' : 'Devolver a más tardar'}</span><span class="val">${escaparHtml(fechaHoraLegible(constancia.devolucion))}</span></div>
  </div>
  <div class="tarjeta"><h3>Usuario responsable del bien</h3><div class="datos">${constancia.usuario.map(dato).join('')}</div>
  ${constancia.aceptoEl ? aparte(`Aceptó el formato de responsabilidad en la app el ${escaparHtml(fechaHoraLegible(constancia.aceptoEl))}.`) : ''}</div>
  <div class="tarjeta"><h3>Dispositivo</h3><div class="datos">${constancia.dispositivo.map(dato).join('')}
    <div><span class="etq">Estado del equipo</span><span class="estado">${escaparHtml(constancia.estadoEquipo)}</span></div></div>
  ${constancia.notas ? aparte(`<span class="etq">Notas</span>${escaparHtml(constancia.notas)}`) : ''}</div>
  <div class="tarjeta"><h3>Para constancia de lo anterior firman</h3>
    <table class="firmas"><tbody><tr>${firmas}</tr></tbody></table>
  </div>
  <ol class="notas">${notas}</ol>
  <p class="verificacion">Código de verificación: <b>${codigoVerificacion(constancia)}</b>. Si algún dato cambia, el código no coincide con el de la app.</p>
</body></html>`;
}

/**
 * Genera el PDF y abre el menú del sistema para compartirlo. Devuelve si se pudo compartir; si
 * no, el archivo queda generado y la pantalla lo dice.
 */
export async function compartirConstanciaPdf(
  constancia: ConstanciaPrestamo,
): Promise<{ compartido: boolean }> {
  // Como el reporte de estadísticas: el PDF va a la caché de la app para poder compartirlo (#307).
  const fecha = constancia.prestamo.slice(0, 10);
  const uri = await guardarPdf(htmlDeConstancia(constancia), `constancia-prestamo-${fecha}.pdf`);
  if (!(await Sharing.isAvailableAsync())) {
    return { compartido: false };
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Compartir la constancia del préstamo',
    UTI: 'com.adobe.pdf',
  });
  return { compartido: true };
}
