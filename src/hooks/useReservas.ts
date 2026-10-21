/**
 * Hooks de reservas: la solicitud de la comunidad (HU-18) y la gestión del personal (HU-19).
 * useReservas(estado) alimenta la bandeja; las mutaciones solicitan, deciden y reservan para
 * terceros, y refrescan la bandeja, las notificaciones y la disponibilidad de espacios (HU-17).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import {
  ErrorReserva,
  solicitarReserva,
  type AlternativaReserva,
  type FormularioReserva,
} from '@/api/espacios';
import {
  crearReservaTercero,
  decidirReserva,
  obtenerMisReservas,
  obtenerSolicitudesReserva,
  type CambiosReserva,
  type DatosReservaTercero,
  type DecisionReserva,
} from '@/api/reservas';
import { useSesion } from '@/store/sesion';
import type { EstadoSolicitud } from '@/types';

/** Para que la pantalla (María, #55) tipe el formulario sin importar de src/api. */
export type { AlternativaReserva, FormularioReserva };

export function useReservas(estado: EstadoSolicitud | 'todas' = 'todas') {
  return useQuery({
    queryKey: claves.reservasPorEstado(estado),
    queryFn: () => obtenerSolicitudesReserva(estado),
  });
}

type DatosDecision = {
  id: string;
  decision: DecisionReserva;
  motivo?: string;
  cambios?: CambiosReserva;
};

export function useDecidirReserva() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, motivo, cambios }: DatosDecision) =>
      decidirReserva(id, decision, motivo, cambios),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.reservas });
      queryClient.invalidateQueries({ queryKey: claves.notificaciones });
      queryClient.invalidateQueries({ queryKey: claves.disponibilidadTodas });
    },
  });
}

export function useCrearReservaTercero() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: DatosReservaTercero) => crearReservaTercero(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.reservas });
      queryClient.invalidateQueries({ queryKey: claves.notificaciones });
      queryClient.invalidateQueries({ queryKey: claves.disponibilidadTodas });
    },
  });
}

/**
 * Solicita una reserva a nombre del usuario de la sesión (HU-18).
 * Si el horario está ocupado, el error es un ErrorReserva con `alternativas` (CA2).
 */
export function useSolicitarReserva() {
  const queryClient = useQueryClient();
  const usuario = useSesion((estado) => estado.usuario);

  return useMutation({
    mutationFn: (datos: FormularioReserva) => {
      if (!usuario) throw new Error('No hay sesión');
      return solicitarReserva(usuario, datos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.reservas });
      queryClient.invalidateQueries({ queryKey: claves.notificaciones });
      queryClient.invalidateQueries({ queryKey: claves.disponibilidadTodas });
    },
  });
}

/**
 * Alternativas de un ErrorReserva, para que la pantalla (María, #55) no importe de src/api.
 * Devuelve [] si el error no es de disponibilidad.
 *
 *   const alternativas = alternativasDeError(solicitud.error);
 */
export function alternativasDeError(error: unknown): AlternativaReserva[] {
  return error instanceof ErrorReserva ? error.alternativas : [];
}

/** Reservas del usuario de la sesión, por fecha (HU-27 y HU-08). No consulta sin sesión. */
export function useMisReservas() {
  const usuario = useSesion((estado) => estado.usuario);

  return useQuery({
    queryKey: claves.misReservas(usuario?.id),
    queryFn: () => {
      if (!usuario) throw new Error('No hay sesión');
      return obtenerMisReservas(usuario.id);
    },
    enabled: usuario != null,
  });
}
