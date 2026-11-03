/**
 * Hooks del repositorio institucional, DSpace (HU-11).
 *
 *   const { data } = useBusquedaRepositorio(texto);
 *   data.pages.flatMap((pagina) => pagina.resultados); // todos los cargados
 *   abrirRepositorio(texto);                         // la búsqueda en el navegador; sin texto, el inicio
 *
 *   const comprobar = useComprobarRepositorio();     // HU-11: comprobar antes de abrir (CA3)
 *   await comprobar.mutateAsync();
 *   await abrirRepositorio();
 */
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import {
  buscarEnRepositorio,
  comprobarRepositorio,
  urlBusquedaRepositorio,
  urlRepositorioPrincipal,
} from '@/api/repositorio';
import { abrirEnNavegador } from '@/utils/navegador';

/** Los resultados de una búsqueda no cambian a cada rato: se reutilizan por 5 minutos. */
const VIGENCIA_BUSQUEDA_MS = 5 * 60 * 1000;

/** Trabajos del repositorio, de 20 en 20. Sin texto no consulta. */
export function useBusquedaRepositorio(texto: string) {
  const buscado = texto.trim();
  return useInfiniteQuery({
    queryKey: claves.busquedaRepositorio(buscado),
    queryFn: ({ pageParam }) => buscarEnRepositorio(buscado, pageParam),
    initialPageParam: 0,
    getNextPageParam: (ultima) => ultima.siguiente ?? undefined,
    enabled: buscado !== '',
    staleTime: VIGENCIA_BUSQUEDA_MS,
  });
}

/**
 * Comprueba que el repositorio responde (HU-11, CA3). No abre el navegador ni invalida nada:
 * si pasa, la pantalla llama abrirRepositorio(); si falla, muestra error.message.
 */
export function useComprobarRepositorio() {
  return useMutation({ mutationFn: comprobarRepositorio });
}

/**
 * Abre el repositorio en el navegador integrado: la búsqueda del texto, con sus filtros, o
 * la página principal. Devuelve la promesa: quien la llame atrapa el error.
 */
export function abrirRepositorio(texto = '') {
  const buscado = texto.trim();
  return abrirEnNavegador(
    buscado !== '' ? urlBusquedaRepositorio(buscado) : urlRepositorioPrincipal(),
  );
}
