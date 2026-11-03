/**
 * Hook de la orientación de autoarchivo (HU-11). Para ir al repositorio, la pantalla usa
 * useComprobarRepositorio() y abrirRepositorio() de useRepositorio.
 *
 *   const { data: orientacion, isPending, isError, refetch } = useOrientacionAutoarchivo();
 */
import { useQuery } from '@tanstack/react-query';

import { obtenerOrientacionAutoarchivo } from '@/api/autoarchivo';
import { claves } from '@/api/claves';

/** Para que la pantalla de HU-11 (María) tipe la orientación sin importar de src/api. */
export type { OrientacionAutoarchivo } from '@/api/autoarchivo';

export function useOrientacionAutoarchivo() {
  return useQuery({
    queryKey: claves.orientacionAutoarchivo,
    queryFn: obtenerOrientacionAutoarchivo,
  });
}
