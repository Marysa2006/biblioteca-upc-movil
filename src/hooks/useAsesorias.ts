/**
 * Hooks de asesorías (HU-13).
 * Temas y jornadas del personal; al guardar una jornada se refrescan sus franjas.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  guardarJornada,
  guardarTema,
  obtenerJornadas,
  obtenerTemas,
  type DatosJornada,
  type DatosTema,
} from '@/api/asesorias';
import { claves } from '@/api/claves';

export function useTemas() {
  return useQuery({
    queryKey: claves.temasAsesoria,
    queryFn: obtenerTemas,
  });
}

export function useJornadas() {
  return useQuery({
    queryKey: claves.jornadasAsesoria,
    queryFn: obtenerJornadas,
  });
}

export function useGuardarTema() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: DatosTema) => guardarTema(datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.temasAsesoria }),
  });
}

export function useGuardarJornada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: DatosJornada) => guardarJornada(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.jornadasAsesoria });
      queryClient.invalidateQueries({ queryKey: claves.franjasTodas });
    },
  });
}
