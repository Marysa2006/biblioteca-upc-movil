/**
 * Hooks del control de asistencia con QR (HU-33) y del registro con el QR (HU-32).
 *
 *   const abrir = useAbrirAsistencia();
 *   const { data: asistencia } = useAsistencia(sesionId);
 *   const manual = useMarcarAsistenciaManual();
 *   const registrar = useRegistrarAsistenciaQr();
 *   registrar.mutate(textoEscaneado);
 *
 * Abrir, marcar, registrar y cerrar invalidan la asistencia de la sesión para que la lista y
 * el total queden al día en la pantalla del facilitador.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  abrirAsistencia,
  cerrarAsistencia,
  marcarAsistenciaManual,
  obtenerAsistentes,
  obtenerCodigoAsistencia,
  registrarAsistencia,
  type DatosAsistenciaManual,
} from '@/api/asistencia';
import { claves } from '@/api/claves';
import { usaApi } from '@/api/cliente';
import { useSesion } from '@/store/sesion';
import { tienePermiso } from '@/utils/roles';

/**
 * Asistencia de la sesión: código vigente, registros y total (CA2).
 * Con `actualizar`, se vuelve a pedir cada 5 segundos para que el facilitador vea a quienes
 * escanean sin recargar (solo mientras la pantalla está abierta). Una asistencia cerrada ya no
 * cambia (CA4), así que deja de pedirse.
 */
export function useAsistencia(sesionId: string, { actualizar = false } = {}) {
  return useQuery({
    queryKey: claves.asistenciaSesion(sesionId),
    queryFn: () => obtenerAsistentes(sesionId),
    enabled: sesionId !== '',
    refetchInterval: (consulta) => (actualizar && !consulta.state.data?.cerrada ? 5000 : false),
  });
}

export function useAbrirAsistencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sesionId: string) => abrirAsistencia(sesionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.asistenciasTodas }),
  });
}

export function useCodigoAsistencia(sesionId: string, { permitirMock = false } = {}) {
  return useQuery({
    queryKey: [...claves.asistenciaSesion(sesionId), 'qr'],
    queryFn: () => obtenerCodigoAsistencia(sesionId),
    enabled: (permitirMock || usaApi('asistencia')) && sesionId !== '',
  });
}

export function useMarcarAsistenciaManual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sesionId, ...datos }: { sesionId: string } & DatosAsistenciaManual) => {
      if ('usuarioId' in datos && !tienePermiso(useSesion.getState().usuario, 'roles')) {
        throw new Error('Registra la asistencia con el nombre de la persona.');
      }
      return marcarAsistenciaManual(sesionId, datos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claves.asistenciasTodas });
      queryClient.invalidateQueries({ queryKey: claves.estadisticasTodas });
    },
  });
}

/**
 * Registra la asistencia de la persona de la sesión con el texto del QR que escaneó (HU-32).
 * Si el QR no sirve, el error trae el mensaje listo para mostrar (CA2).
 */
export function useRegistrarAsistenciaQr() {
  const queryClient = useQueryClient();
  const usuario = useSesion((estado) => estado.usuario);

  return useMutation({
    mutationFn: (codigo: string) => {
      if (!usuario) throw new Error('No hay sesión');
      return registrarAsistencia(codigo, usuario);
    },
    onSuccess: (asistencia) => {
      if (!usaApi('asistencia')) queryClient.setQueryData(claves.asistenciaSesion(asistencia.sesionId), asistencia);
      queryClient.invalidateQueries({ queryKey: claves.asistenciasTodas });
      // El registro de uso (HU-25 y HU-26).
      queryClient.invalidateQueries({ queryKey: claves.estadisticasTodas });
    },
  });
}

export function useCerrarAsistencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sesionId: string) => cerrarAsistencia(sesionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: claves.asistenciasTodas }),
  });
}
