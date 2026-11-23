/**
 * La constancia del préstamo de tablet en PDF (versión 1.1, #253): el mismo contenido que se ve
 * en la app, en el orden del formato, convertido con `expo-print` y compartido con `expo-sharing`.
 * Los dos se importan solo aquí, como en exportarPdf.ts, para que no pesen en el resto.
 */
import * as Sharing from 'expo-sharing';

import { escaparHtml, guardarPdf } from '@/utils/exportarPdf';
import { hoyISO } from '@/utils/fechas';
import { fechaHoraLegible, type ConstanciaPrestamo, type DatoConstancia } from '@/utils/prestamos';

function filas(datos: DatoConstancia[]): string {
  return datos
    .map((dato) => `<tr><th>${escaparHtml(dato.etiqueta)}</th><td>${escaparHtml(dato.valor)}</td></tr>`)
    .join('');
}

function seccion(titulo: string, datos: DatoConstancia[]): string {
  return `<section><h2>${escaparHtml(titulo)}</h2><table><tbody>${filas(datos)}</tbody></table></section>`;
}

/** El HTML de la constancia. Es puro: la misma constancia da el mismo documento. */
export function htmlDeConstancia(constancia: ConstanciaPrestamo): string {
  const fechas: DatoConstancia[] = [
    { etiqueta: 'Préstamo', valor: fechaHoraLegible(constancia.prestamo) },
    {
      etiqueta: constancia.recibio ? 'Devolución' : 'Devolver a más tardar',
      valor: fechaHoraLegible(constancia.devolucion),
    },
  ];
  const estado: DatoConstancia[] = [
    { etiqueta: 'Estado', valor: constancia.estadoEquipo },
    ...(constancia.notas ? [{ etiqueta: 'Notas', valor: constancia.notas }] : []),
  ];
  const responsables: DatoConstancia[] = [
    { etiqueta: 'Entregó', valor: constancia.entrego ?? 'Pendiente' },
    { etiqueta: 'Recibió la devolución', valor: constancia.recibio ?? 'Pendiente' },
  ];
  const notas = constancia.notasLegales.map((nota) => `<li>${escaparHtml(nota)}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, Roboto, sans-serif; color: #131B2E; margin: 24px; font-size: 12px; }
  h1 { color: #107B42; font-size: 18px; margin-bottom: 0; }
  .fecha { color: #5B6375; margin-top: 4px; }
  h2 { color: #107B42; font-size: 13px; margin-bottom: 4px; border-bottom: 1px solid #E1E7E1; }
  section { margin-top: 14px; page-break-inside: avoid; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-weight: normal; color: #5B6375; width: 40%; padding: 3px 0; }
  td { padding: 3px 0; }
  ol { padding-left: 18px; color: #5B6375; }
</style></head>
<body>
  <h1>Formato de responsabilidad sobre el préstamo de tablet</h1>
  <p class="fecha">Biblioteca · Universidad Popular del Cesar · generado el ${hoyISO()}.</p>
  ${seccion('Fechas', fechas)}
  ${seccion('Usuario', constancia.usuario)}
  ${seccion('Dispositivo', constancia.dispositivo)}
  ${seccion('Estado del equipo', estado)}
  ${seccion('Responsables', responsables)}
  <section><h2>Notas</h2><ol>${notas}</ol></section>
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
