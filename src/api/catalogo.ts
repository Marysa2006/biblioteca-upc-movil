/**
 * Acceso al catálogo público (OPAC) de Koha (HU-02).
 * La app no reimplementa Koha: busca en el RSS público del OPAC, comprueba que responda y
 * arma las direcciones que se abren en el navegador integrado.
 *
 * La búsqueda no usa la API REST de Koha: en la Universidad está apagada y buscar registros
 * exige una cuenta del personal, que no puede ir dentro de la app. El RSS es público.
 * Tampoco usa los mocks: los datos del catálogo son públicos y reales.
 *
 * No usa peticion() de ./cliente: Koha no es nuestra API, no debe recibir el token
 * de la sesión y un 4xx también cuenta como "disponible".
 */
import { Platform } from 'react-native';

import type { PaginaResultados } from '@/utils/busqueda';
import { leerResultadosCatalogo } from '@/utils/catalogo';
import { URL_CATALOGO_KOHA } from '@/utils/constantes';

const TIEMPO_LIMITE_MS = 8000;

/** Página principal del OPAC. */
export function urlCatalogoPrincipal(): string {
  return `${URL_CATALOGO_KOHA}/cgi-bin/koha/opac-main.pl`;
}

/** Resultados de búsqueda del OPAC para el texto dado. */
export function urlBusquedaCatalogo(texto: string): string {
  return `${URL_CATALOGO_KOHA}/cgi-bin/koha/opac-search.pl?q=${encodeURIComponent(texto.trim())}`;
}

/**
 * Busca en el catálogo y devuelve una página de resultados (20 por página, lo que da Koha).
 * `desde` es la posición del primer resultado: 0, 20, 40…
 * Lanza un error si Koha no responde, tarda demasiado o no devuelve el RSS.
 * En la web, el navegador la bloquea por CORS: la pantalla muestra el error con reintentar.
 */
export async function buscarEnCatalogo(texto: string, desde = 0): Promise<PaginaResultados> {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_MS);
  try {
    const respuesta = await fetch(`${urlBusquedaCatalogo(texto)}&format=rss&offset=${desde}`, {
      signal: controlador.signal,
    });
    if (!respuesta.ok) {
      throw new Error(`Koha respondió ${respuesta.status}.`);
    }
    return leerResultadosCatalogo(await respuesta.text(), URL_CATALOGO_KOHA);
  } finally {
    clearTimeout(temporizador);
  }
}

/**
 * Indica si el OPAC responde.
 * - URL vacía: no disponible.
 * - Error de red, tiempo agotado o 5xx: no disponible.
 * - Cualquier otra respuesta (incluidas 4xx y 405): disponible.
 *
 * En la web no se comprueba: el navegador bloquearía la petición por CORS y la
 * ventana emergente si se abre tras esperar. La web es del subequipo Frontend.
 */
export async function comprobarDisponibilidadCatalogo(): Promise<boolean> {
  if (URL_CATALOGO_KOHA === '') {
    return false;
  }
  if (Platform.OS === 'web') {
    return true;
  }

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_MS);
  try {
    const respuesta = await fetch(urlCatalogoPrincipal(), {
      method: 'HEAD',
      signal: controlador.signal,
    });
    return respuesta.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(temporizador);
  }
}
