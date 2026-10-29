/**
 * Compromisos del usuario para "Mi calendario" (HU-30). Funciones puras: unen las reservas,
 * las citas de asesoría y los préstamos de tablet en una sola lista ordenada.
 *
 * Entran las reservas y citas aprobadas y los préstamos reservados (por recoger), entregados
 * (por devolver) o vencidos (marcados con `vencido`). No filtra por fecha: el calendario decide
 * qué día o mes muestra.
 */
import type { Cita, Espacio, Prestamo, Reserva } from '@/types';

export type TipoCompromiso = 'reserva' | 'asesoria' | 'tablet';

/** Tipo de vista del calendario; no va en src/types. */
export type Compromiso = {
  /** Prefijado para no chocar: reserva-…, asesoria-…, tablet-… */
  id: string;
  tipo: TipoCompromiso;
  /** 'AAAA-MM-DD'. */
  fecha: string;
  /** 'HH:MM'. */
  horaInicio: string;
  /** 'HH:MM'; en una tablet es la hora límite. */
  horaFin: string;
  lugar: string;
  titulo: string;
  detalle?: string;
  /** Préstamo de tablet que ya pasó la hora límite sin devolverse (HU-24). */
  vencido?: boolean;
};

/** Préstamos que son un compromiso: recoger la tablet o devolverla, aunque ya esté vencido. */
const ESTADOS_PRESTAMO_COMPROMISO: Prestamo['estado'][] = ['reservado', 'entregado', 'vencido'];

function deReserva(reserva: Reserva, espacios: Espacio[]): Compromiso {
  const espacio = espacios.find((actual) => actual.id === reserva.espacioId);
  const proposito = reserva.proposito.trim();
  return {
    id: `reserva-${reserva.id}`,
    tipo: 'reserva',
    fecha: reserva.fecha,
    horaInicio: reserva.horaInicio,
    horaFin: reserva.horaFin,
    lugar: espacio?.nombre ?? 'Espacio reservado',
    titulo: 'Reserva de espacio',
    ...(proposito ? { detalle: proposito } : {}),
  };
}

function deCita(cita: Cita): Compromiso {
  return {
    id: `asesoria-${cita.id}`,
    tipo: 'asesoria',
    fecha: cita.fecha,
    horaInicio: cita.horaInicio,
    horaFin: cita.horaFin,
    lugar: cita.modalidad === 'virtual' ? 'Virtual' : 'Biblioteca',
    titulo: cita.tema,
    detalle: `Con ${cita.facilitador}`,
  };
}

/** Sin código ni modelo: el calendario no consulta el inventario. */
function dePrestamo(prestamo: Prestamo): Compromiso {
  return {
    id: `tablet-${prestamo.id}`,
    tipo: 'tablet',
    fecha: prestamo.fecha,
    horaInicio: prestamo.horaInicio,
    horaFin: prestamo.horaLimite,
    lugar: 'Biblioteca',
    titulo: 'Préstamo de tablet',
    ...(prestamo.estado === 'vencido'
      ? { vencido: true, detalle: 'Ya pasó la hora límite: devuélvela cuanto antes' }
      : {}),
  };
}

/** Todos los compromisos, por fecha, hora de inicio y tipo. Sin datos, []. */
export function construirCompromisos({
  reservas,
  citas,
  prestamos,
  espacios,
}: {
  reservas: Reserva[];
  citas: Cita[];
  prestamos: Prestamo[];
  espacios: Espacio[];
}): Compromiso[] {
  return [
    ...reservas
      .filter((reserva) => reserva.estado === 'aprobada')
      .map((reserva) => deReserva(reserva, espacios)),
    ...citas.filter((cita) => cita.estado === 'aprobada').map(deCita),
    ...prestamos
      .filter((prestamo) => ESTADOS_PRESTAMO_COMPROMISO.includes(prestamo.estado))
      .map(dePrestamo),
  ].sort(
    (a, b) =>
      a.fecha.localeCompare(b.fecha) ||
      a.horaInicio.localeCompare(b.horaInicio) ||
      a.tipo.localeCompare(b.tipo),
  );
}
