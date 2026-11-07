/**
 * Mis solicitudes (HU-08): nombres de cada tipo, grupos de las pestañas, filtros y textos.
 * Funciones puras, sin hooks. Los datos salen de useMisSolicitudes() (src/hooks/useSolicitudes).
 */
import type {
  CategoriaServicio,
  EstadoSolicitud,
  Prestamo,
  ResumenSolicitud,
  TipoSolicitud,
} from '@/types';
import { fechaCompleta } from '@/utils/calendario';
import { fechaLegible } from '@/utils/fechas';

/** Cómo se nombra cada tipo y de qué categoría de servicio toma el ícono y el acento. */
export const TIPOS_SOLICITUD: Record<
  TipoSolicitud,
  { nombre: string; plural: string; categoria: CategoriaServicio }
> = {
  reserva: { nombre: 'Reserva de espacio', plural: 'Reservas', categoria: 'espacios' },
  cita: { nombre: 'Asesoría', plural: 'Asesorías', categoria: 'asesorias' },
  prestamo: { nombre: 'Tablet', plural: 'Tablets', categoria: 'tablets' },
  capacitacion: { nombre: 'Capacitación', plural: 'Capacitaciones', categoria: 'capacitaciones' },
};

/** Orden de los chips por tipo. */
export const ORDEN_TIPOS: TipoSolicitud[] = ['reserva', 'cita', 'prestamo', 'capacitacion'];

export function esTipoSolicitud(valor: string | undefined): valor is TipoSolicitud {
  return valor != null && valor in TIPOS_SOLICITUD;
}

/** Pestañas de la lista: en curso, finalizadas o todas. */
export type GrupoSolicitudes = 'en_curso' | 'finalizadas' | 'todas';

const ESTADOS_EN_CURSO: readonly EstadoSolicitud[] = ['pendiente', 'aprobada', 'nueva_fecha'];

export const GRUPOS_SOLICITUDES: { valor: GrupoSolicitudes; etiqueta: string }[] = [
  { valor: 'en_curso', etiqueta: 'En curso' },
  { valor: 'finalizadas', etiqueta: 'Finalizadas' },
  { valor: 'todas', etiqueta: 'Todas' },
];

export function enGrupo(solicitud: Pick<ResumenSolicitud, 'estado'>, grupo: GrupoSolicitudes) {
  if (grupo === 'todas') return true;
  const enCurso = ESTADOS_EN_CURSO.includes(solicitud.estado);
  return grupo === 'en_curso' ? enCurso : !enCurso;
}

/** Filtro por tipo de los chips: uno o todos. */
export type FiltroTipo = TipoSolicitud | 'todos';

export function filtrarSolicitudes(
  lista: ResumenSolicitud[],
  grupo: GrupoSolicitudes,
  tipo: FiltroTipo,
): ResumenSolicitud[] {
  return lista.filter(
    (solicitud) => enGrupo(solicitud, grupo) && (tipo === 'todos' || solicitud.tipo === tipo),
  );
}

/** "Lunes 9 de noviembre · 10:00", o sin hora si no la tiene. */
export function textoFechaSolicitud(fecha: string, hora?: string): string {
  return hora ? `${fechaCompleta(fecha)} · ${hora}` : fechaCompleta(fecha);
}

/** Fecha de un evento del historial ('AAAA-MM-DD HH:MM'): "15 de octubre, 10:20". */
export function textoFechaEvento(fechaHora: string): string {
  const [fecha, hora] = fechaHora.split(' ');
  return hora ? `${fechaLegible(fecha)}, ${hora}` : fechaLegible(fecha);
}

/** Lo que dice la tarjeta de un préstamo sobre su estado real; alerta si está vencido. */
export type NotaPrestamo = { texto: string; alerta: boolean };

/**
 * El estado real de un préstamo de tablet. La lista común lo muestra como "Aprobada" mientras
 * sigue en curso (estadoDePrestamo, #186), así que la tarjeta y el detalle lo aclaran aquí.
 */
export function notaDePrestamo(
  prestamo: Pick<Prestamo, 'estado' | 'horaInicio' | 'horaLimite'>,
): NotaPrestamo | null {
  switch (prestamo.estado) {
    case 'reservado':
      return {
        texto: `Reservada: recógela en la biblioteca desde las ${prestamo.horaInicio}.`,
        alerta: false,
      };
    case 'entregado':
      return { texto: `Entregada: devuélvela antes de las ${prestamo.horaLimite}.`, alerta: false };
    case 'vencido':
      return {
        texto: `Vencida: pasó la hora límite (${prestamo.horaLimite}). Devuélvela cuanto antes.`,
        alerta: true,
      };
    default:
      return null;
  }
}
