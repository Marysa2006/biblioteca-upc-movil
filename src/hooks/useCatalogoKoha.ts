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
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import {
  buscarEnCatalogo,
  comprobarDisponibilidadCatalogo,
  urlBusquedaCatalogo,
  urlCatalogoPrincipal,
} from '@/api/catalogo';
import { claves } from '@/api/claves';
import { abrirEnNavegador } from '@/utils/navegador';

export type { ResultadoBusqueda } from '@/utils/busqueda';

/** Los resultados de una búsqueda no cambian a cada rato: se reutilizan por 5 minutos. */
const VIGENCIA_BUSQUEDA_MS = 5 * 60 * 1000;

/**
 * Resultados del catálogo dentro de la app, de 20 en 20 (HU-02).
 * Sin texto no consulta. `fetchNextPage()` trae la página siguiente; `hasNextPage` dice si hay.
 *
 *   const { data } = useBusquedaCatalogo(texto);
 *   data.pages.flatMap((pagina) => pagina.resultados); // todos los cargados
 *   data.pages[0].total;                           // total de la búsqueda
 */
export function useBusquedaCatalogo(texto: string) {
  const buscado = texto.trim();
  return useInfiniteQuery({
    queryKey: claves.busquedaCatalogo(buscado),
    queryFn: ({ pageParam }) => buscarEnCatalogo(buscado, pageParam),
    initialPageParam: 0,
    getNextPageParam: (ultima) => ultima.siguiente ?? undefined,
    enabled: buscado !== '',
    staleTime: VIGENCIA_BUSQUEDA_MS,
  });
}

export type EstadoCatalogo = 'inactivo' | 'comprobando' | 'no_disponible';

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
      await abrirEnNavegador(url);
    } catch {
      setEstado('no_disponible');
    } finally {
      abriendo.current = false;
    }
  }, []);

  return { estado, abrirCatalogo };
}
