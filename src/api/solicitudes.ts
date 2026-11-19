/**
 * «Mis solicitudes» (HU-08, CA1 y CA3): reservas, citas, préstamos y capacitaciones del
 * usuario en una sola lista, la más reciente primero. Reutiliza las consultas de cada servicio
 * y no consulta el inventario de tablets, que es del personal. El historial de cada una está
 * en ./historial. Al final, la calificación de asesorías y capacitaciones (#254).
 * La ruta es provisional: confírmenla con el equipo de Backend.
 */
import type {
  Cita,
  Espacio,
  EstadoSolicitud,
  Prestamo,
  Reserva,
  ResumenSolicitud,
  SolicitudCapacitacion,
  TipoSolicitud,
  Usuario,
} from '@/types';
import type { DatosCalificacion } from '@/utils/calificacion';

import { calificarCita, obtenerMisCitas } from './asesorias';
import { calificarCapacitacion, obtenerMisCapacitaciones } from './capacitaciones';
import { ErrorApi, peticion, USAR_MOCKS } from './cliente';
import { obtenerEspacios } from './espacios';
import { estadoDePrestamo } from './historial';
import { obtenerMisReservas } from './reservas';
import { obtenerMisPrestamos } from './tablets';

/** Filtro de la lista: un estado o todas. */
export type FiltroSolicitudes = EstadoSolicitud | 'todas';

function deReserva(reserva: Reserva, espacios: Espacio[]): ResumenSolicitud {
  const espacio = espacios.find((actual) => actual.id === reserva.espacioId);
  return {
    id: reserva.id,
    tipo: 'reserva',
    // Si el espacio ya no está activo, no viene en la lista pública.
    titulo: espacio?.nombre ?? 'Reserva de espacio',
    fecha: reserva.fecha,
    hora: reserva.horaInicio,
    estado: reserva.estado,
  };
}

function deCita(cita: Cita): ResumenSolicitud {
  return {
    id: cita.id,
    tipo: 'cita',
    titulo: cita.tema,
    fecha: cita.fecha,
    hora: cita.horaInicio,
    estado: cita.estado,
  };
}

function dePrestamo(prestamo: Prestamo): ResumenSolicitud {
  return {
    id: prestamo.id,
    tipo: 'prestamo',
    titulo: 'Préstamo de tablet',
    fecha: prestamo.fecha,
    hora: prestamo.horaInicio,
    estado: estadoDePrestamo(prestamo.estado),
  };
}

function deCapacitacion(solicitud: SolicitudCapacitacion): ResumenSolicitud {
  return {
    id: solicitud.id,
    tipo: 'capacitacion',
    titulo: solicitud.linea,
    fecha: solicitud.fecha,
    ...(solicitud.hora ? { hora: solicitud.hora } : {}),
    estado: solicitud.estado,
  };
}

/** Por fecha y hora del servicio, la más reciente primero; sin hora, al final de su día. */
function ordenar(lista: ResumenSolicitud[]): ResumenSolicitud[] {
  return [...lista].sort(
    (a, b) => b.fecha.localeCompare(a.fecha) || (b.hora ?? '').localeCompare(a.hora ?? ''),
  );
}

/**
 * Todas las solicitudes del usuario, o solo las de un estado. Sin solicitudes, [] (CA3).
 * Los préstamos van con el estado común (estadoDePrestamo); su estado real está en el historial.
 */
export async function obtenerMisSolicitudes(
  usuarioId: string,
  estado: FiltroSolicitudes = 'todas',
): Promise<ResumenSolicitud[]> {
  if (!USAR_MOCKS) {
    const consulta = estado === 'todas' ? '' : `?estado=${estado}`;
    return peticion<ResumenSolicitud[]>(`/solicitudes/mias/${consulta}`);
  }

  const [reservas, citas, prestamos, capacitaciones, espacios] = await Promise.all([
    obtenerMisReservas(usuarioId),
    obtenerMisCitas(usuarioId),
    obtenerMisPrestamos(usuarioId),
    obtenerMisCapacitaciones(usuarioId),
    obtenerEspacios(),
  ]);
  const todas = [
    ...reservas.map((reserva) => deReserva(reserva, espacios)),
    ...citas.map(deCita),
    ...prestamos.map(dePrestamo),
    ...capacitaciones.map(deCapacitacion),
  ];
  const filtradas = estado === 'todas' ? todas : todas.filter((s) => s.estado === estado);
  return ordenar(filtradas);
}

// ── Versión 1.1: calificación del servicio (#254) ─────────────────────────

/** Las solicitudes que se califican: asesorías y capacitaciones. */
export type TipoCalificable = Extract<TipoSolicitud, 'cita' | 'capacitacion'>;

export type { DatosCalificacion } from '@/utils/calificacion';

/**
 * Califica una asesoría o una capacitación realizada del usuario de la sesión (#254). Las
 * reglas (una sola vez, 403, 400) y los registros (historial y uso) están en calificarCita() y
 * calificarCapacitacion(). Otro tipo de solicitud no se califica: 400.
 */
export async function calificarSolicitud(
  tipo: TipoCalificable,
  id: string,
  datos: DatosCalificacion,
  usuario: Usuario,
): Promise<Cita | SolicitudCapacitacion> {
  if (tipo === 'cita') return calificarCita(usuario, id, datos);
  if (tipo === 'capacitacion') return calificarCapacitacion(usuario, id, datos);
  throw new ErrorApi(400, 'Este tipo de solicitud no se califica.');
}
