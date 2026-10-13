/**
 * Hook de acceso al catálogo de Koha (HU-02).
 * La tarjeta del catálogo usa este hook: no comprueba Koha ni abre el navegador por su cuenta.
 *
 *   const { estado, abrirCatalogo } = useCatalogoKoha();
 *   abrirCatalogo(textoBuscado); // vacío o sin texto: página principal
 *
 * El OPAC se abre en el navegador integrado; al cerrarlo, la persona vuelve al mismo
 * punto de la app con la sesión y la pestaña intactas (CA3).
 */
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useRef, useState } from 'react';

import {
  comprobarDisponibilidadCatalogo,
  urlBusquedaCatalogo,
  urlCatalogoPrincipal,
} from '@/api/catalogo';
import { colores } from '@/theme';

export type EstadoCatalogo = 'inactivo' | 'comprobando' | 'no_disponible';

const OPCIONES_NAVEGADOR: WebBrowser.WebBrowserOpenOptions = {
  toolbarColor: colores.primario,
  secondaryToolbarColor: colores.primario,
  controlsColor: colores.superficie,
  showTitle: true,
};

export function useCatalogoKoha() {
  const [estado, setEstado] = useState<EstadoCatalogo>('inactivo');
  // Evita el doble toque mientras se comprueba o el navegador está abierto.
  const abriendo = useRef(false);

  const abrirCatalogo = useCallback(async (busqueda?: string) => {
    if (abriendo.current) return;
    abriendo.current = true;
    setEstado('comprobando');

    try {
      const disponible = await comprobarDisponibilidadCatalogo();
      if (!disponible) {
        setEstado('no_disponible');
        return;
      }
      setEstado('inactivo');
      const texto = busqueda?.trim() ?? '';
      const url = texto !== '' ? urlBusquedaCatalogo(texto) : urlCatalogoPrincipal();
      // En Android resuelve apenas se abre Custom Tabs, así que el bloqueo se libera de
      // inmediato; en iOS resuelve al cerrar, pero el navegador es modal y tapa la app.
      await WebBrowser.openBrowserAsync(url, OPCIONES_NAVEGADOR);
    } catch {
      setEstado('no_disponible');
    } finally {
      abriendo.current = false;
    }
  }, []);

  return { estado, abrirCatalogo };
}
