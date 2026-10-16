/**
 * Navegador integrado (expo-web-browser) con los colores del tema.
 * Lo usan el catálogo de Koha (HU-02) y los recursos académicos (HU-03).
 *
 * No es una función pura: abre el navegador. Vive aquí porque solo envuelve
 * expo-web-browser con las opciones de la app; no consulta datos.
 */
import * as WebBrowser from 'expo-web-browser';

import { colores } from '@/theme';

export const OPCIONES_NAVEGADOR: WebBrowser.WebBrowserOpenOptions = {
  toolbarColor: colores.primario,
  secondaryToolbarColor: colores.primario,
  controlsColor: colores.superficie,
  showTitle: true,
};

/**
 * Abre la URL en el navegador integrado; al cerrarlo, la persona vuelve al mismo punto de la app.
 * Devuelve la promesa de expo-web-browser: quien la llame atrapa el error.
 */
export function abrirEnNavegador(url: string) {
  return WebBrowser.openBrowserAsync(url, OPCIONES_NAVEGADOR);
}
