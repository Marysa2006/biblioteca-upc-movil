/**
 * Hooks de asesorías (HU-13, HU-14 y HU-15).
 * Temas y jornadas del personal; al guardar una jornada se refrescan sus franjas.
 * La comunidad consulta franjas y sus citas; agendar, cancelar o reprogramar refresca
 * las citas (también la agenda del facilitador), los cupos de las franjas y las notificaciones.
 * El facilitador consulta su agenda y registra el resultado o la inasistencia.
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
  obtenerAgenda,
  obtenerFranjas,
  obtenerJornadas,
  obtenerMisCitas,
  obtenerTemas,
  registrarInasistencia,
  registrarResultado,
  reprogramarCita,
  type DatosJornada,
  type DatosTema,
} from '@/api/asesorias';
import { claves } from '@/api/claves';
import { useSesion } from '@/store/sesion';

/** Para que la pantalla de HU-15 (María) tipe la agenda sin importar de src/api. */
export type { CitaAgenda } from '@/api/asesorias';

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

/**
 * Agenda de asesorías entre dos fechas (HU-15). Sin facilitadorId, la del usuario de la
 * sesión; la administración pasa 'todas' o el id de un facilitador. No consulta sin sesión.
 */
export function useAgenda(desde: string, hasta: string, facilitadorId?: string | 'todas') {
  const usuario = useSesion((estado) => estado.usuario);
  const filtro = facilitadorId ?? usuario?.id;

  return useQuery({
    queryKey: claves.agendaFacilitador(filtro ?? 'sin-sesion', desde, hasta),
    queryFn: () => {
      if (!usuario || !filtro) throw new Error('No hay sesión');
      return obtenerAgenda(filtro, desde, hasta);
    },
    enabled: usuario != null && desde !== '' && hasta !== '',
  });
}

/** Registra el resultado de una cita que ya terminó. Refresca la agenda y las citas. */
export function useRegistrarResultado() {
  const queryClient = useQueryClient();
  const usuario = useSesion((estado) => estado.usuario);

  return useMutation({
    mutationFn: ({ citaId, resultado }: { citaId: string; resultado: string }) => {
      if (!usuario) throw new Error('No hay sesión');
      return registrarResultado(usuario, citaId, resultado);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.citasAsesoria }),
  });
}

/** Registra que la persona no asistió a una cita que ya terminó. Refresca la agenda y las citas. */
export function useRegistrarInasistencia() {
  const queryClient = useQueryClient();
  const usuario = useSesion((estado) => estado.usuario);

  return useMutation({
    mutationFn: (citaId: string) => {
      if (!usuario) throw new Error('No hay sesión');
      return registrarInasistencia(usuario, citaId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.citasAsesoria }),
  });
}
