/**
 * Hooks de asesorías (HU-13 y HU-14).
 * Temas y jornadas del personal; al guardar una jornada se refrescan sus franjas.
 * La comunidad consulta franjas y sus citas; agendar, cancelar o reprogramar refresca
 * las citas, los cupos de las franjas y las notificaciones.
 *
 *   const { data: franjas } = useFranjas(temaId, desde, hasta);
 *   const agendar = useAgendarCita();
 *   agendar.mutate({ franjaId, necesidad });
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  agendarCita,
  cancelarCita,
  guardarJornada,
  guardarTema,
  obtenerFranjas,
  obtenerJornadas,
  obtenerMisCitas,
  obtenerTemas,
  reprogramarCita,
  type DatosJornada,
  type DatosTema,
} from '@/api/asesorias';
import { claves } from '@/api/claves';
import { useSesion } from '@/store/sesion';

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

/** Franjas que se pueden pedir de un tema, en un rango de fechas (HU-14, CA1 y CA4). */
export function useFranjas(temaId: string, desde: string, hasta: string) {
  return useQuery({
    queryKey: claves.franjasAsesoria(temaId, desde, hasta),
    queryFn: () => obtenerFranjas(temaId, desde, hasta),
    enabled: temaId !== '' && desde !== '' && hasta !== '',
  });
}

/** Citas del usuario de la sesión, por fecha (HU-14). No consulta sin sesión. */
export function useMisCitas() {
  const usuario = useSesion((estado) => estado.usuario);

  return useQuery({
    queryKey: claves.misCitas(usuario?.id),
    queryFn: () => {
      if (!usuario) throw new Error('No hay sesión');
      return obtenerMisCitas(usuario.id);
    },
    enabled: usuario != null,
  });
}

/** Lo que cambia al agendar, cancelar o reprogramar: citas, cupos y avisos. */
function useRefrescarCitas() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: claves.citasAsesoria });
    queryClient.invalidateQueries({ queryKey: claves.franjasTodas });
    queryClient.invalidateQueries({ queryKey: claves.notificaciones });
  };
}

/** Agenda una cita a nombre del usuario de la sesión (CA1); sin cupo, falla (CA2). */
export function useAgendarCita() {
  const refrescar = useRefrescarCitas();
  const usuario = useSesion((estado) => estado.usuario);

  return useMutation({
    mutationFn: ({ franjaId, necesidad }: { franjaId: string; necesidad: string }) => {
      if (!usuario) throw new Error('No hay sesión');
      return agendarCita(usuario, franjaId, necesidad);
    },
    onSuccess: refrescar,
  });
}

/** Cancela una cita del usuario dentro del plazo (CA3). */
export function useCancelarCita() {
  const refrescar = useRefrescarCitas();
  const usuario = useSesion((estado) => estado.usuario);

  return useMutation({
    mutationFn: (id: string) => {
      if (!usuario) throw new Error('No hay sesión');
      return cancelarCita(usuario, id);
    },
    onSuccess: refrescar,
  });
}

/** Pasa una cita del usuario a otra franja del mismo tema, dentro del plazo (CA3). */
export function useReprogramarCita() {
  const refrescar = useRefrescarCitas();
  const usuario = useSesion((estado) => estado.usuario);

  return useMutation({
    mutationFn: ({ id, nuevaFranjaId }: { id: string; nuevaFranjaId: string }) => {
      if (!usuario) throw new Error('No hay sesión');
      return reprogramarCita(usuario, id, nuevaFranjaId);
    },
    onSuccess: refrescar,
  });
}
