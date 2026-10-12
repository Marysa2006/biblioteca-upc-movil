/**
 * Acceso al catálogo público (OPAC) de Koha (HU-02).
 * La app no reimplementa Koha: solo comprueba que responda y arma las direcciones
 * que se abren en el navegador integrado.
 *
 * No usa peticion() de ./cliente: Koha no es nuestra API, no debe recibir el token
 * de la sesión y un 4xx también cuenta como "disponible".
 */
import { Platform } from 'react-native';

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
