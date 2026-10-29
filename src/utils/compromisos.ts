/**
 * Compromisos del usuario para "Mi calendario" (HU-30). Funciones puras: unen las reservas,
 * las citas de asesoría y los préstamos de tablet en una sola lista ordenada.
 *
 * Entran las reservas y citas aprobadas y los préstamos reservados (por recoger) o entregados
 * (por devolver). No filtra por fecha: el calendario decide qué día o mes muestra.
 */
import type { Cita, Espacio, Prestamo, Reserva, Tablet } from '@/types';

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
};

/** Préstamos que son un compromiso: recoger la tablet o devolverla. */
const ESTADOS_PRESTAMO_COMPROMISO: Prestamo['estado'][] = ['reservado', 'entregado'];

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

function dePrestamo(prestamo: Prestamo, tablets: Tablet[]): Compromiso {
  const tablet = tablets.find((actual) => actual.id === prestamo.tabletId);
  // Sin la tablet en el inventario, el id hace de código.
  const codigo = tablet?.codigo ?? prestamo.tabletId;
  return {
    id: `tablet-${prestamo.id}`,
    tipo: 'tablet',
    fecha: prestamo.fecha,
    horaInicio: prestamo.horaInicio,
    horaFin: prestamo.horaLimite,
    lugar: 'Biblioteca',
    titulo: 'Préstamo de tablet',
    detalle: tablet?.modelo ? `Tablet ${codigo} · ${tablet.modelo}` : `Tablet ${codigo}`,
  };
}

/** Todos los compromisos, por fecha, hora de inicio y tipo. Sin datos, []. */
export function construirCompromisos({
  reservas,
  citas,
  prestamos,
  espacios,
  tablets,
}: {
  reservas: Reserva[];
  citas: Cita[];
  prestamos: Prestamo[];
  espacios: Espacio[];
  tablets: Tablet[];
}): Compromiso[] {
  return [
    ...reservas
      .filter((reserva) => reserva.estado === 'aprobada')
      .map((reserva) => deReserva(reserva, espacios)),
    ...citas.filter((cita) => cita.estado === 'aprobada').map(deCita),
    ...prestamos
      .filter((prestamo) => ESTADOS_PRESTAMO_COMPROMISO.includes(prestamo.estado))
      .map((prestamo) => dePrestamo(prestamo, tablets)),
  ].sort(
    (a, b) =>
      a.fecha.localeCompare(b.fecha) ||
      a.horaInicio.localeCompare(b.horaInicio) ||
      a.tipo.localeCompare(b.tipo),
  );
}
