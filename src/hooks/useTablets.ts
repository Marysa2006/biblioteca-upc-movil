/**
 * Hooks del inventario de tablets (HU-21), de la solicitud de préstamo (HU-22), de la
 * entrega/devolución (HU-23) y de los préstamos vencidos (HU-24).
 * Las mutaciones refrescan la disponibilidad y, según el caso, los préstamos, las tablets
 * y las notificaciones. La consulta de vencidos marca y avisa los nuevos.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { claves } from '@/api/claves';
import {
  cambiarEstadoTablet,
  crearTablet,
  editarTablet,
  ErrorPrestamo,
  obtenerCondicionesTablet,
  obtenerDisponibilidadTablets,
  obtenerMisPrestamos,
  obtenerPrestamos,
  obtenerPrestamosVencidos,
  obtenerTablets,
  registrarDevolucion,
  registrarEntrega,
  solicitarPrestamo,
  type AlternativaPrestamo,
  type DatosDevolucion,
  type DatosEntrega,
  type DatosTablet,
  type FormularioPrestamo,
} from '@/api/tablets';
import { useSesion } from '@/store/sesion';
import type { EstadoPrestamo, EstadoTablet } from '@/types';

/** Para que la pantalla de HU-22 (María) tipe el formulario sin importar de src/api. */
export type {
  AlternativaPrestamo,
  DiaTablets,
  FormularioPrestamo,
  FranjaPrestamo,
  FranjaTablets,
} from '@/api/tablets';

export function useTablets() {
  return useQuery({
    queryKey: claves.tablets,
    queryFn: obtenerTablets,
  });
}

export function useCrearTablet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: DatosTablet) => crearTablet(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.tablets });
      queryClient.invalidateQueries({ queryKey: claves.disponibilidadTabletsTodas });
    },
  });
}

export function useEditarTablet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: string; datos: DatosTablet }) => editarTablet(id, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.tablets });
      queryClient.invalidateQueries({ queryKey: claves.disponibilidadTabletsTodas });
    },
  });
}

export function useCambiarEstadoTablet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoTablet }) =>
      cambiarEstadoTablet(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.tablets });
      queryClient.invalidateQueries({ queryKey: claves.disponibilidadTabletsTodas });
    },
  });
}

/** Franjas de 1 hora de un día con las tablets libres (HU-22). No consulta sin fecha. */
export function useDisponibilidadTablets(fecha: string) {
  return useQuery({
    queryKey: claves.disponibilidadTabletsDia(fecha),
    queryFn: () => obtenerDisponibilidadTablets(fecha),
    enabled: fecha !== '',
  });
}

/** Condiciones de uso que el usuario acepta antes de solicitar (HU-22, CA3). */
export function useCondicionesTablet() {
  return useQuery({
    queryKey: claves.condicionesTablet,
    queryFn: obtenerCondicionesTablet,
  });
}

/** Préstamos del usuario de la sesión, por fecha (HU-22 y HU-30). No consulta sin sesión. */
export function useMisPrestamos() {
  const usuario = useSesion((estado) => estado.usuario);

  return useQuery({
    queryKey: claves.misPrestamos(usuario?.id),
    queryFn: () => {
      if (!usuario) throw new Error('No hay sesión');
      return obtenerMisPrestamos(usuario.id);
    },
    enabled: usuario != null,
  });
}

/**
 * Solicita una tablet a nombre del usuario de la sesión (HU-22).
 * Si no hay tablets libres, el error es un ErrorPrestamo con `alternativas` (CA2).
 * No refresca las tablets: su estado operativo no cambia al reservar.
 */
export function useSolicitarPrestamo() {
  const queryClient = useQueryClient();
  const usuario = useSesion((estado) => estado.usuario);

  return useMutation({
    mutationFn: (datos: FormularioPrestamo) => {
      if (!usuario) throw new Error('No hay sesión');
      return solicitarPrestamo(usuario, datos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.prestamosTablet });
      queryClient.invalidateQueries({ queryKey: claves.disponibilidadTabletsTodas });
      queryClient.invalidateQueries({ queryKey: claves.notificaciones });
    },
  });
}

/**
 * Alternativas de un error de solicitud (CA2), o [] si el error es otro. Así la pantalla
 * no importa ErrorPrestamo desde src/api:
 *   const alternativas = alternativasDePrestamo(solicitud.error);
 */
export function alternativasDePrestamo(error: unknown): AlternativaPrestamo[] {
  return error instanceof ErrorPrestamo ? error.alternativas : [];
}

/** Préstamos de tablets, filtrados por estado (HU-23). */
export function usePrestamos(estado: EstadoPrestamo | 'todas' = 'todas') {
  return useQuery({
    queryKey: claves.prestamosPorEstado(estado),
    queryFn: () => obtenerPrestamos(estado),
  });
}

/** Registra la entrega y refresca los préstamos y las tablets (HU-23, CA1). */
export function useRegistrarEntrega() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ prestamoId, datos }: { prestamoId: string; datos: DatosEntrega }) =>
      registrarEntrega(prestamoId, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.prestamosTablet });
      queryClient.invalidateQueries({ queryKey: claves.tablets });
      queryClient.invalidateQueries({ queryKey: claves.disponibilidadTabletsTodas });
    },
  });
}

/**
 * Préstamos vencidos para la sección Vencidos de Inventario (HU-24). No consulta sin sesión.
 * Ojo: la consulta tiene efectos. Con mocks marca `vencido` los entregados atrasados y crea
 * la alerta del encargado y el aviso del usuario, una vez por préstamo; con la API real, el
 * Backend hace esa revisión programada y la app solo lee.
 * Si hay vencidos, refresca las listas de préstamos y las notificaciones. No invalida
 * claves.prestamosTablet: es el prefijo ['prestamos'] y volvería a lanzar esta consulta.
 */
export function usePrestamosVencidos() {
  const usuario = useSesion((estado) => estado.usuario);
  const queryClient = useQueryClient();

  const consulta = useQuery({
    queryKey: claves.prestamosVencidos,
    queryFn: obtenerPrestamosVencidos,
    enabled: usuario != null,
  });

  useEffect(() => {
    if (!consulta.data?.length) return;

    queryClient.invalidateQueries({ queryKey: claves.prestamosPorEstado('todas') });
    queryClient.invalidateQueries({ queryKey: claves.prestamosPorEstado('entregado') });
    queryClient.invalidateQueries({ queryKey: claves.prestamosPorEstado('vencido') });

    for (const solicitanteId of new Set(consulta.data.map((prestamo) => prestamo.solicitanteId))) {
      queryClient.invalidateQueries({ queryKey: claves.misPrestamos(solicitanteId) });
    }

    queryClient.invalidateQueries({ queryKey: claves.notificaciones });
  }, [consulta.data, queryClient]);

  return consulta;
}

/** Registra la devolución y refresca los préstamos y las tablets (HU-23, CA2-CA4). */
export function useRegistrarDevolucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ prestamoId, datos }: { prestamoId: string; datos: DatosDevolucion }) =>
      registrarDevolucion(prestamoId, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.prestamosTablet });
      queryClient.invalidateQueries({ queryKey: claves.tablets });
      queryClient.invalidateQueries({ queryKey: claves.disponibilidadTabletsTodas });
    },
  });
}
