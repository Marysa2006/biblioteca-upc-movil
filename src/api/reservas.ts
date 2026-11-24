/**
 * Gestión de reservas del personal (HU-19).
 * El personal aprueba, rechaza, propone otra fecha o cancela, y reserva para terceros.
 * Cada decisión deja una notificación (HU-27) y un evento en el historial (HU-08) en los
 * datos de prueba.
 * Con la API (módulo `espacios`), «Mis reservas» de la comunidad sale del Backend. La bandeja del
 * personal se conecta por separado (módulo `reservas`).
 */
import { useSesion } from '@/store/sesion';
import type {
  Bloqueo,
  DatosSolicitante,
  EstadoSolicitud,
  RecursoApoyo,
  Reserva,
} from '@/types';
import { esDiaHabil } from '@/utils/parametros';

import {
  espacioDesdeBackend,
  miReservaDesdeBackend,
  type DetalleSolicitudBackend,
  type EspacioBackend,
} from './backend/espacios';
import {
  franjasDeConflicto,
  reservaPersonalDesdeBackend,
  reservaTerceroHaciaBackend,
  type ReservaPersonalBackend,
} from './backend/reservas';
import { ESTADO_DESDE_BACKEND } from './backend/equivalencias';
import { ErrorApi, peticion, peticionTodas, simularRed, usaApi, USAR_MOCKS } from './cliente';
import { RESERVAS } from './mocks/reservas';
import { datosDeSolicitante, registrarUso } from './estadisticas';
import { registrarEvento } from './historial';
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
  correoSolicitante?: string;
};

const RUTA_PERSONAL = '/spaces/manage/reservations/';
const idsReserva = new Map<string, number>();

function leerReservaPersonal(registro: ReservaPersonalBackend): Reserva {
  const reserva = reservaPersonalDesdeBackend(registro);
  idsReserva.set(reserva.id, registro.id);
  return reserva;
}

async function rutaGestionReserva(id: string) {
  if (!idsReserva.has(id)) await obtenerSolicitudesReserva();
  const idBackend = idsReserva.get(id);
  if (idBackend === undefined) throw new ErrorApi(404, 'La solicitud no existe.');
  return `${RUTA_PERSONAL}${idBackend}/`;
}

async function guardarReservaPersonal(ruta: string, metodo: 'POST' | 'PATCH', cuerpo: object) {
  try {
    return leerReservaPersonal(await peticion<ReservaPersonalBackend>(ruta, {
      method: metodo, body: JSON.stringify(cuerpo),
    }));
  } catch (error) {
    if (error instanceof ErrorApi && error.estado === 409) {
      const franjas = franjasDeConflicto(error.cuerpo);
      if (franjas.length) {
        error.message = `${error.message} Franjas libres: ${franjas.join(', ')}.`;
      }
    }
    throw error;
  }
}

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
export async function obtenerSolicitudesReserva(
  estado: EstadoSolicitud | 'todas' = 'todas',
): Promise<Reserva[]> {
  if (usaApi('reservas')) {
    const estados = Object.entries(ESTADO_DESDE_BACKEND).filter(([, valor]) => valor === estado);
    const consulta = estados.length === 1 ? `?status=${estados[0][0]}` : '';
    const lista = await peticionTodas(`${RUTA_PERSONAL}${consulta}`, leerReservaPersonal);
    return ordenar(estado === 'todas' ? lista : lista.filter((r) => r.estado === estado));
  }
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
  if (usaApi('reservas')) {
    const reason = motivo?.trim();
    if ((decision === 'rechazar' || decision === 'cancelar') && !reason) {
      throw new ErrorApi(400, 'El motivo es obligatorio para rechazar o cancelar.');
    }
    if (decision === 'nueva_fecha' && !cambios?.fecha) {
      throw new ErrorApi(400, 'Indica la nueva fecha de la reserva.');
    }
    const ruta = await rutaGestionReserva(id);
    if (decision === 'nueva_fecha') {
      const actual = await peticion<ReservaPersonalBackend>(ruta);
      return guardarReservaPersonal(ruta, 'PATCH', {
        date: cambios?.fecha === actual.date ? undefined : cambios?.fecha,
        start_time: cambios?.horaInicio === actual.start_time.slice(0, 5) ? undefined : cambios?.horaInicio,
        end_time: cambios?.horaFin === actual.end_time.slice(0, 5) ? undefined : cambios?.horaFin,
        reason,
      });
    }
    const accion = { aprobar: 'approve', rechazar: 'reject', cancelar: 'cancel' }[decision];
    return guardarReservaPersonal(`${ruta}${accion}/`, 'POST', { reason });
  }
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
    // HU-08: la nota es el motivo y, con nueva fecha, la fecha propuesta.
    registrarEvento(
      'reserva',
      actualizada.id,
      actualizada.estado,
      'Personal de la biblioteca',
      [
        motivo?.trim(),
        decision === 'nueva_fecha'
          ? `Nueva fecha: ${actualizada.fecha} de ${actualizada.horaInicio} a ${actualizada.horaFin}.`
          : '',
      ]
        .filter(Boolean)
        .join(' '),
    );

    // HU-25: cada operación completada deja su registro de uso.
    registrarUso({
      id: `uso-reserva-${actualizada.id}`,
      servicio: 'espacios',
      finalidad: actualizada.proposito,
      // #307: la decisión del personal cuenta para el tiempo de respuesta.
      respondida: true,
      fecha: actualizada.fecha,
      modalidad: 'presencial',
      // Rechazar o cancelar es una operación cancelada; aprobar, completada; nueva fecha, pendiente.
      estado:
        decision === 'aprobar'
          ? 'completada'
          : decision === 'rechazar' || decision === 'cancelar'
            ? 'cancelada'
            : 'pendiente',
      ...(datosDeSolicitante(actualizada.solicitanteId) ?? {}),
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
 * El Backend la deja pendiente y avisa al solicitante.
 */
export async function crearReservaTercero({
  correoSolicitante,
  ...datos
}: DatosReservaTercero): Promise<Reserva> {
  if (usaApi('reservas')) {
    const correo = correoSolicitante?.trim();
    if (!correo) throw new ErrorApi(400, 'Indica el correo del solicitante.');
    return guardarReservaPersonal(RUTA_PERSONAL, 'POST', reservaTerceroHaciaBackend(datos, correo));
  }
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
    registrarEvento(
      'reserva',
      nueva.id,
      'aprobada',
      'Personal de la biblioteca',
      'Creada por el personal.',
    );

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
    registrarEvento('reserva', cancelada.id, 'cancelada', 'Personal de la biblioteca', motivo);
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
  /** En la interfaz se llama «Novedades» desde la versión 1.1. */
  requerimientos?: string;

  // ── Versión 1.1: solicitud completa (#224) ─────────────────
  // Opcionales mientras la UI (#251) no los envíe. Con `datosSolicitante` llega la solicitud
  // completa: se validan todos, con la identificación, y los términos son obligatorios.
  sede?: string;
  recursos?: RecursoApoyo[];
  datosSolicitante?: DatosSolicitante;
  /** TERMINOS_ESPACIOS. */
  terminosAceptados?: boolean;
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
  registrarEvento('reserva', nueva.id, 'pendiente', nueva.solicitante, 'Solicitud enviada.');

  // HU-25: la solicitud también cuenta como operación (queda pendiente).
  registrarUso({
    id: `uso-reserva-${nueva.id}`,
    servicio: 'espacios',
    finalidad: nueva.proposito,
    fecha: nueva.fecha,
    modalidad: 'presencial',
    estado: 'pendiente',
    ...(datosDeSolicitante(nueva.solicitanteId) ?? {}),
  });

  return { ...nueva };
}

/** Reservas del usuario de la sesión, ordenadas por fecha (HU-27 y HU-08). */
export async function obtenerMisReservas(usuarioId: string): Promise<Reserva[]> {
  if (usaApi('espacios')) {
    const solicitante = { id: usuarioId, nombre: useSesion.getState().usuario?.nombre ?? '' };
    const [ids, catalogo] = await Promise.all([
      peticionTodas<{ id: number }, number>(
        '/me/requests/?service=SPACE_RESERVATION',
        (solicitud) => solicitud.id,
      ),
      peticion<{ spaces: EspacioBackend[] }>('/spaces/'),
    ]);
    const espacios = catalogo.spaces.map(espacioDesdeBackend);
    // El resumen no trae las horas ni el propósito: se pide el detalle de cada una.
    const detalles = await Promise.all(
      ids.map((id) => peticion<DetalleSolicitudBackend>(`/me/requests/${id}/`)),
    );
    return ordenar(
      detalles.map((detalle) => miReservaDesdeBackend(detalle, solicitante, espacios)),
    );
  }
  if (USAR_MOCKS) {
    const mias = reservas.filter((reserva) => reserva.solicitanteId === usuarioId);
    return simularRed(ordenar(mias).map((reserva) => ({ ...reserva })));
  }
  // Ruta provisional: confirmar con Backend.
  return peticion<Reserva[]>('/reservas/mias/');
}

