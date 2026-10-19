/**
 * Hooks de espacios y disponibilidad (HU-17).
 * La pantalla (María, #53) solo usa estos hooks.
 *
 *   const { data: espacios } = useEspacios();
 *   const { data: dias } = useDisponibilidad('esp-biblioteca', '2026-10-19', '2026-10-25');
 */
import { useQuery } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import { obtenerDisponibilidad, obtenerEspacios } from '@/api/espacios';

/** Espacios activos para la comunidad. */
export function useEspacios() {
  return useQuery({
    queryKey: claves.espacios,
    queryFn: obtenerEspacios,
  });
}

/** Disponibilidad de un espacio entre dos fechas (ambas incluidas). */
export function useDisponibilidad(espacioId: string, desde: string, hasta: string) {
  return useQuery({
    queryKey: claves.disponibilidad(espacioId, desde, hasta),
    queryFn: () => obtenerDisponibilidad(espacioId, desde, hasta),
    enabled: espacioId !== '' && desde !== '' && hasta !== '',
  });
}
