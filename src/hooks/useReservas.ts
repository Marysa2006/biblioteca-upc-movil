/**
 * Hooks de gestión de reservas (HU-19).
 * useReservas(estado) alimenta la bandeja; las mutaciones deciden y reservan para terceros,
 * y refrescan la bandeja, las notificaciones y la disponibilidad de espacios (HU-17).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import {
  crearReservaTercero,
  decidirReserva,
  obtenerSolicitudesReserva,
  type CambiosReserva,
  type DatosReservaTercero,
  type DecisionReserva,
} from '@/api/reservas';
import type { EstadoSolicitud } from '@/types';

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
