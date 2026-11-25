/**
 * Los datos del Dashboard del personal (#306).
 *
 * Pide solo lo de los permisos de la persona: cada consulta corre con `enabled` según su permiso,
 * así un gestor de espacios no pide préstamos ni citas. Usa las mismas claves y funciones que
 * Gestión y Estadísticas, así que comparten la caché: lo que se aprueba en Gestión se ve aquí al
 * volver, y al revés.
 * - Reservas (`reservas`), capacitaciones (`formacion`) y préstamos (`tablets`): todas.
 * - Citas (`asesorias`): la agenda de los últimos 30 días a los próximos 60, como Gestión →
 *   Agenda: la administración ve todas; el facilitador, las suyas y las pendientes sin asignar.
 * - Espacios: los nombres, para decir dónde es cada reserva.
 * - Registros de uso (`estadisticas`): las últimas semanas, para la Afluencia semanal.
 */
import { useQuery } from '@tanstack/react-query';

import { obtenerAgenda } from '@/api/asesorias';
import { obtenerSolicitudesCapacitacion } from '@/api/capacitaciones';
import { claves } from '@/api/claves';
import { obtenerEspacios } from '@/api/espacios';
import { obtenerRegistrosUso, obtenerResumenEstadistico } from '@/api/estadisticas';
import { usaApi } from '@/api/cliente';
import { obtenerSolicitudesReserva } from '@/api/reservas';
import { obtenerPrestamos } from '@/api/tablets';
import { sumarDias } from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';
import type { DatosPanel } from '@/utils/panel';
import { afluenciaDesdeTotales, afluenciaSemanal, SEMANAS_AFLUENCIA } from '@/utils/panel';

import { useRol } from './useRol';

/** El rango de la agenda que mira el Dashboard. */
const DIAS_ATRAS = 30;
const DIAS_ADELANTE = 60;

export function usePanel() {
  const { usuario, esAdministrador, tienePermiso } = useRol();
  const hoy = hoyISO();
  const conReservas = tienePermiso('reservas');
  const conAsesorias = tienePermiso('asesorias');
  const conFormacion = tienePermiso('formacion');
  const conTablets = tienePermiso('tablets');
  const conEstadisticas = tienePermiso('estadisticas');

  const desdeAgenda = sumarDias(hoy, -DIAS_ATRAS);
  const hastaAgenda = sumarDias(hoy, DIAS_ADELANTE);
  const filtroAgenda = esAdministrador ? 'todas' : usuario?.id;
  const desdeAfluencia = sumarDias(hoy, -(SEMANAS_AFLUENCIA * 7 - 1));

  const reservas = useQuery({
    queryKey: claves.reservasPorEstado('todas'),
    queryFn: () => obtenerSolicitudesReserva('todas'),
    enabled: conReservas,
  });
  const capacitaciones = useQuery({
    queryKey: claves.solicitudesCapacitacion('todas'),
    queryFn: () => obtenerSolicitudesCapacitacion('todas'),
    enabled: conFormacion,
  });
  const citas = useQuery({
    queryKey: claves.agendaFacilitador(filtroAgenda ?? 'sin-sesion', desdeAgenda, hastaAgenda),
    queryFn: () => obtenerAgenda(filtroAgenda ?? 'todas', desdeAgenda, hastaAgenda),
    enabled: conAsesorias && filtroAgenda != null,
  });
  const prestamos = useQuery({
    queryKey: claves.prestamosPorEstado('todas'),
    queryFn: () => obtenerPrestamos('todas'),
    enabled: conTablets,
  });
  const espacios = useQuery({
    queryKey: claves.espacios,
    queryFn: obtenerEspacios,
    enabled: conReservas,
  });
  const registros = useQuery({
    queryKey: [...claves.estadisticasTodas, 'afluencia', desdeAfluencia, hoy],
    queryFn: async () => {
      if (usaApi('estadisticas')) {
        const datos = await obtenerResumenEstadistico({ desde: desdeAfluencia, hasta: hoy });
        return afluenciaDesdeTotales(
          Array.from({ length: 7 }, (_, i) => datos.porDiaSemana?.[i]?.cantidad ?? 0),
        );
      }
      return afluenciaSemanal(await obtenerRegistrosUso({ desde: desdeAfluencia }), hoy);
    },
    enabled: conEstadisticas,
  });

  // Las consultas de las solicitudes y los préstamos: las que alimentan las cifras.
  const activas = [
    conReservas && reservas,
    conFormacion && capacitaciones,
    conAsesorias && citas,
    conTablets && prestamos,
  ].filter((consulta) => consulta !== false);

  const datos: DatosPanel = {
    reservas: conReservas ? reservas.data : undefined,
    capacitaciones: conFormacion ? capacitaciones.data : undefined,
    citas: conAsesorias ? citas.data : undefined,
    prestamos: conTablets ? prestamos.data : undefined,
  };

  const nombresEspacios = new Map(
    (espacios.data ?? []).map((espacio) => [espacio.id, espacio.nombre]),
  );

  return {
    hoy,
    datos,
    asistencia: {
      cargando: (conAsesorias && citas.isPending) || (conFormacion && capacitaciones.isPending),
      conError: (conAsesorias && citas.isError) || (conFormacion && capacitaciones.isError),
      reintentar: () =>
        void Promise.all([
          ...(conAsesorias ? [citas.refetch()] : []),
          ...(conFormacion ? [capacitaciones.refetch()] : []),
        ]),
    },
    /** Si la persona tiene algo que ver en el Dashboard (solicitudes o préstamos). */
    conSolicitudes: activas.length > 0,
    cargando: activas.some((consulta) => consulta.isPending),
    conError: activas.some((consulta) => consulta.isError),
    /** El rango de la agenda, para abrir el detalle de una cita (agenda/[id]). */
    rangoAgenda: { desde: desdeAgenda, hasta: hastaAgenda },
    nombreEspacio: (id: string) => nombresEspacios.get(id),
    registros: {
      activa: conEstadisticas,
      lista: registros.data,
      cargando: registros.isPending,
      conError: registros.isError,
      reintentar: () => registros.refetch(),
    },
    /** Vuelve a pedir todo lo que la persona puede ver (al deslizar o al volver a la pestaña). */
    recargar: () =>
      Promise.all([
        ...activas.map((consulta) => consulta.refetch()),
        ...(conReservas ? [espacios.refetch()] : []),
        ...(conEstadisticas ? [registros.refetch()] : []),
      ]),
  };
}
