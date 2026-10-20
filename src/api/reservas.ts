/**
 * Gestión de reservas del personal (HU-19).
 * El personal aprueba, rechaza, propone otra fecha o cancela, y reserva para terceros.
 * Cada decisión deja una notificación en los datos de prueba (HU-27).
 * Las rutas son provisionales: confírmenlas con el equipo de Backend.
 */
import type { Bloqueo, EstadoSolicitud, Reserva } from '@/types';
import { esDiaHabil } from '@/utils/parametros';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { RESERVAS } from './mocks/reservas';
import { crearNotificacion } from './notificaciones';
import { obtenerParametros } from './parametros';

/** Copia mutable: con mocks, las decisiones se ven durante la sesión de la app. */
let reservas: Reserva[] = RESERVAS.map((reserva) => ({ ...reserva }));

/** Lo que el personal puede decidir sobre una solicitud (HU-19). */
export type DecisionReserva = 'aprobar' | 'rechazar' | 'cancelar' | 'nueva_fecha';

/** Cambios al proponer otra fecha (HU-19). */
export type CambiosReserva = {
  fecha?: string;
  horaInicio?: string;
  horaFin?: string;
};

/** Reserva que el personal crea en nombre de un tercero (HU-19). */
export type DatosReservaTercero = {
  espacioId: string;
  solicitanteId: string;
  solicitante: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  proposito: string;
  asistentes: number;
  requerimientos?: string;
};

/** Estados que ocupan una franja: con ellos se detectan los choques de horario (CA3). */
const ESTADOS_OCUPAN: readonly EstadoSolicitud[] = ['pendiente', 'aprobada', 'nueva_fecha'];

function seSolapan(inicioA: string, finA: string, inicioB: string, finB: string): boolean {
  return inicioA < finB && inicioB < finA;
}

function hayChoque(candidata: {
  id?: string;
  espacioId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
}): boolean {
  return reservas.some(
    (reserva) =>
      reserva.id !== candidata.id &&
      reserva.espacioId === candidata.espacioId &&
      reserva.fecha === candidata.fecha &&
      ESTADOS_OCUPAN.includes(reserva.estado) &&
      seSolapan(candidata.horaInicio, candidata.horaFin, reserva.horaInicio, reserva.horaFin),
  );
}

function ordenar(lista: Reserva[]): Reserva[] {
  return [...lista].sort((a, b) =>
    a.fecha === b.fecha ? a.horaInicio.localeCompare(b.horaInicio) : a.fecha.localeCompare(b.fecha),
  );
}

function tituloDeDecision(decision: DecisionReserva): string {
  switch (decision) {
    case 'aprobar':
      return 'Reserva aprobada';
    case 'rechazar':
      return 'Reserva rechazada';
    case 'cancelar':
      return 'Reserva cancelada';
    case 'nueva_fecha':
      return 'Nueva fecha propuesta';
  }
}

function mensajeDeDecision(reserva: Reserva, decision: DecisionReserva, motivo?: string): string {
  const cuando = `${reserva.fecha} a las ${reserva.horaInicio}`;
  switch (decision) {
    case 'aprobar':
      return `Tu reserva del ${cuando} fue aprobada.`;
    case 'rechazar':
      return `Tu reserva del ${cuando} fue rechazada: ${motivo ?? ''}`.trim();
    case 'cancelar':
      return `Tu reserva del ${cuando} fue cancelada: ${motivo ?? ''}`.trim();
    case 'nueva_fecha':
      return `Se propone una nueva fecha para tu reserva: ${cuando}. ${motivo ?? ''}`.trim();
  }
}

/** Solicitudes de reserva para la bandeja del personal (HU-19). */
export function obtenerSolicitudesReserva(
  estado: EstadoSolicitud | 'todas' = 'todas',
): Promise<Reserva[]> {
  if (USAR_MOCKS) {
    const lista = estado === 'todas' ? reservas : reservas.filter((r) => r.estado === estado);
    return simularRed(ordenar(lista).map((reserva) => ({ ...reserva })));
  }
  const consulta = estado === 'todas' ? '' : `?estado=${estado}`;
  return peticion<Reserva[]>(`/reservas/${consulta}`);
}

/**
 * Aprueba, rechaza, propone otra fecha o cancela una solicitud (HU-19).
 * CA2: rechazar o cancelar exige motivo. CA3: no permite choques de horario; la fecha
 * propuesta debe ser un día hábil (esDiaHabil de HU-28).
 */
export async function decidirReserva(
  id: string,
  decision: DecisionReserva,
  motivo?: string,
  cambios?: CambiosReserva,
): Promise<Reserva> {
  if (USAR_MOCKS) {
    const indice = reservas.findIndex((reserva) => reserva.id === id);
    if (indice === -1) {
      throw new ErrorApi(404, 'La solicitud no existe.');
    }
    if ((decision === 'rechazar' || decision === 'cancelar') && !motivo?.trim()) {
      throw new ErrorApi(400, 'El motivo es obligatorio para rechazar o cancelar.');
    }

    const actual = reservas[indice];
    const fecha = cambios?.fecha ?? actual.fecha;
    const horaInicio = cambios?.horaInicio ?? actual.horaInicio;
    const horaFin = cambios?.horaFin ?? actual.horaFin;

    if (decision === 'nueva_fecha') {
      if (!cambios?.fecha) {
        throw new ErrorApi(400, 'Indica la nueva fecha de la reserva.');
      }
      const parametros = await obtenerParametros();
      if (!esDiaHabil(fecha, parametros)) {
        throw new ErrorApi(400, 'La nueva fecha no es un día hábil de la biblioteca.');
      }
    }

    if (
      (decision === 'aprobar' || decision === 'nueva_fecha') &&
      hayChoque({ id, espacioId: actual.espacioId, fecha, horaInicio, horaFin })
    ) {
      throw new ErrorApi(400, 'Ese horario ya está ocupado por otra reserva.');
    }

    const estadoPorDecision: Record<DecisionReserva, EstadoSolicitud> = {
      aprobar: 'aprobada',
      rechazar: 'rechazada',
      cancelar: 'cancelada',
      nueva_fecha: 'nueva_fecha',
    };

    const actualizada: Reserva = {
      ...actual,
      fecha,
      horaInicio,
      horaFin,
      estado: estadoPorDecision[decision],
      motivo: motivo?.trim() || actual.motivo,
    };
    reservas = reservas.map((reserva, i) => (i === indice ? actualizada : reserva));

    crearNotificacion({
      usuarioId: actualizada.solicitanteId,
      solicitudId: actualizada.id,
      titulo: tituloDeDecision(decision),
      mensaje: mensajeDeDecision(actualizada, decision, motivo),
    });

    return simularRed({ ...actualizada });
  }
  return peticion<Reserva>(`/reservas/${id}/decision/`, {
    method: 'POST',
    body: JSON.stringify({ decision, motivo, cambios }),
  });
}

/**
 * El personal crea una reserva en nombre de un tercero (HU-19).
 * Queda aprobada y avisa al solicitante. Valida día hábil y choques de horario.
 */
export async function crearReservaTercero(datos: DatosReservaTercero): Promise<Reserva> {
  if (USAR_MOCKS) {
    if (!datos.proposito?.trim()) {
      throw new ErrorApi(400, 'El propósito es obligatorio.');
    }
    const parametros = await obtenerParametros();
    if (!esDiaHabil(datos.fecha, parametros)) {
      throw new ErrorApi(400, 'La fecha no es un día hábil de la biblioteca.');
    }
    if (hayChoque(datos)) {
      throw new ErrorApi(400, 'Ese horario ya está ocupado por otra reserva.');
    }

    const nueva: Reserva = {
      ...datos,
      id: `res-${Date.now()}`,
      estado: 'aprobada',
    };
    reservas = [...reservas, nueva];

    crearNotificacion({
      usuarioId: nueva.solicitanteId,
      solicitudId: nueva.id,
      titulo: 'Reserva creada',
      mensaje: `El personal reservó el ${nueva.fecha} a las ${nueva.horaInicio} a tu nombre.`,
    });

    return simularRed({ ...nueva });
  }
  return peticion<Reserva>('/reservas/terceros/', { method: 'POST', body: JSON.stringify(datos) });
}

/** Criterio de un bloqueo para saber qué reservas caen dentro (HU-20). */
export type CriterioBloqueo = Omit<Bloqueo, 'id' | 'motivo'>;

function franjaAfecta(reserva: Reserva, criterio: CriterioBloqueo): boolean {
  if (!criterio.horaInicio || !criterio.horaFin) {
    return true; // Bloqueo de todo el día: afecta cualquier hora.
  }
  return seSolapan(reserva.horaInicio, reserva.horaFin, criterio.horaInicio, criterio.horaFin);
}

/**
 * Reservas que ocupan el espacio dentro del bloqueo (HU-20, CA1).
 * Solo cuentan las que ocupan franja: pendientes, aprobadas o con nueva fecha.
 */
export function reservasAfectadasPorBloqueo(criterio: CriterioBloqueo): Reserva[] {
  return reservas.filter(
    (reserva) =>
      reserva.espacioId === criterio.espacioId &&
      reserva.fecha >= criterio.desde &&
      reserva.fecha <= criterio.hasta &&
      ESTADOS_OCUPAN.includes(reserva.estado) &&
      franjaAfecta(reserva, criterio),
  );
}

/**
 * Cancela las reservas indicadas y avisa a cada solicitante (HU-20, CA2).
 * Devuelve las reservas que quedaron canceladas.
 */
export function cancelarReservas(ids: string[], motivo: string): Reserva[] {
  const canceladas: Reserva[] = [];
  reservas = reservas.map((reserva) => {
    if (!ids.includes(reserva.id)) {
      return reserva;
    }
    const cancelada: Reserva = { ...reserva, estado: 'cancelada', motivo };
    canceladas.push(cancelada);
    crearNotificacion({
      usuarioId: cancelada.solicitanteId,
      solicitudId: cancelada.id,
      titulo: 'Reserva cancelada',
      mensaje: `Tu reserva del ${cancelada.fecha} a las ${cancelada.horaInicio} fue cancelada: ${motivo}`,
    });
    return cancelada;
  });
  return canceladas;
}

/** Reserva que solicita un usuario de la comunidad (HU-18); queda pendiente. */
export type DatosSolicitudReserva = {
  espacioId: string;
  solicitanteId: string;
  solicitante: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  proposito: string;
  asistentes: number;
  requerimientos?: string;
};

/**
 * Registra la solicitud de un usuario (HU-18): queda pendiente y avisa en la app (HU-27).
 * La disponibilidad y la capacidad se validan antes, en solicitarReserva() de ./espacios.
 */
export function registrarSolicitudReserva(datos: DatosSolicitudReserva): Reserva {
  const nueva: Reserva = {
    ...datos,
    id: `res-${Date.now()}`,
    estado: 'pendiente',
  };
  reservas = [...reservas, nueva];

  crearNotificacion({
    usuarioId: nueva.solicitanteId,
    solicitudId: nueva.id,
    titulo: 'Solicitud recibida',
    mensaje: `Recibimos tu solicitud para el ${nueva.fecha} de ${nueva.horaInicio} a ${nueva.horaFin}.`,
  });

  return { ...nueva };
}

/** Reservas del usuario de la sesión, ordenadas por fecha (HU-27 y HU-08). */
export function obtenerMisReservas(usuarioId: string): Promise<Reserva[]> {
  if (USAR_MOCKS) {
    const mias = reservas.filter((reserva) => reserva.solicitanteId === usuarioId);
    return simularRed(ordenar(mias).map((reserva) => ({ ...reserva })));
  }
  // Ruta provisional: confirmar con Backend.
  return peticion<Reserva[]>('/reservas/mias/');
}
