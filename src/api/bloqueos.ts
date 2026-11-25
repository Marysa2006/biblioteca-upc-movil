/**
 * Bloqueos institucionales de espacios (HU-20).
 * El personal bloquea un espacio por franja, día o rango de fechas; antes ve las reservas
 * afectadas (CA1) y, al confirmar, se cancelan y se avisa a los afectados (CA2). Sin reservas
 * afectadas, el bloqueo se aplica directo (CA3). Los bloqueos aparecen como "bloqueado" en la
 * disponibilidad de HU-17.
 */
import type { Bloqueo, Reserva } from '@/types';
import { useSesion } from '@/store/sesion';
import { hoyISO } from '@/utils/fechas';
import { registrarEvento } from './historial';
import { registrarUso } from './estadisticas';
import { crearNotificacion } from './notificaciones';

import {
  bloqueoDesdeBackend,
  bloqueoHaciaBackend,
  reservaAfectadaDesdeBackend,
  type BloqueoBackend,
  type ReservaAfectadaBackend,
} from './backend/bloqueos';
import { ErrorApi, peticion, peticionTodas, simularRed, usaApi } from './cliente';
import { BLOQUEOS } from './mocks/reservas';
import { cancelarReservas, reservasAfectadasPorBloqueo } from './reservas';

/** Copia mutable: con mocks, los bloqueos creados se ven durante la sesión de la app. */
let bloqueos: Bloqueo[] = BLOQUEOS.map((bloqueo) => ({ ...bloqueo }));

/** Datos del formulario de bloqueo; el id lo asigna el sistema. */
export type DatosBloqueo = Omit<Bloqueo, 'id'>;

/** Resultado de confirmar un bloqueo (HU-20). */
export type ResultadoBloqueo = {
  bloqueo: Bloqueo;
  /** Reservas canceladas por el bloqueo; vacío si no había ninguna (CA3). */
  canceladas: Reserva[];
};

type RevisionBloqueo = { afectadas: Reserva[] } | { aplicado: ResultadoBloqueo };

const RUTA_BLOQUEOS = '/spaces/blocks/';

async function enviarBloqueo(datos: DatosBloqueo, confirmar: boolean): Promise<ResultadoBloqueo> {
  const respuesta = await peticion<BloqueoBackend>(RUTA_BLOQUEOS, {
    method: 'POST',
    body: JSON.stringify(bloqueoHaciaBackend(datos, confirmar)),
  });
  return {
    bloqueo: bloqueoDesdeBackend(respuesta),
    canceladas: respuesta.cancelled_reservations.map((r) =>
      reservaAfectadaDesdeBackend(r, datos.espacioId),
    ),
  };
}

/** Validación del rango y la franja, sin exigir el motivo (sirve para la previsualización). */
function errorDeRango(datos: DatosBloqueo): ErrorApi | null {
  if (!datos.desde || !datos.hasta) {
    return new ErrorApi(400, 'Indica el rango de fechas del bloqueo.');
  }
  if (datos.desde > datos.hasta) {
    return new ErrorApi(400, 'La fecha final no puede ser anterior a la inicial.');
  }
  const tieneInicio = datos.horaInicio != null && datos.horaInicio !== '';
  const tieneFin = datos.horaFin != null && datos.horaFin !== '';
  if (tieneInicio !== tieneFin) {
    return new ErrorApi(400, 'Indica la hora de inicio y la de fin de la franja.');
  }
  if (tieneInicio && tieneFin && datos.horaInicio! >= datos.horaFin!) {
    return new ErrorApi(400, 'La hora de fin debe ser posterior a la de inicio.');
  }
  return null;
}

function errorDeValidacion(datos: DatosBloqueo): ErrorApi | null {
  if (!datos.motivo?.trim()) {
    return new ErrorApi(400, 'El motivo del bloqueo es obligatorio.');
  }
  return errorDeRango(datos);
}

/** Bloqueos registrados; si se pasa un espacio, solo los suyos (los consulta HU-17). */
export function obtenerBloqueos(espacioId?: string): Promise<Bloqueo[]> {
  if (usaApi('bloqueos')) {
    const consulta = espacioId ? `?space=${encodeURIComponent(espacioId)}` : '';
    return peticionTodas(`${RUTA_BLOQUEOS}${consulta}`, bloqueoDesdeBackend);
  }
  const lista = espacioId ? bloqueos.filter((b) => b.espacioId === espacioId) : bloqueos;
  return simularRed(lista.map((bloqueo) => ({ ...bloqueo })));
}

/** Reservas que quedarían afectadas por el bloqueo, antes de confirmarlo (CA1). */
export async function previsualizarBloqueo(datos: DatosBloqueo): Promise<RevisionBloqueo> {
  if (usaApi('bloqueos')) {
    const error = errorDeValidacion(datos);
    if (error) throw error;
    try {
      return { aplicado: await enviarBloqueo(datos, false) };
    } catch (error) {
      if (!(error instanceof ErrorApi) || error.estado !== 409) throw error;
      const cuerpo = error.cuerpo as { affected_reservations?: ReservaAfectadaBackend[] } | null;
      if (!Array.isArray(cuerpo?.affected_reservations)) throw error;
      return {
        afectadas: cuerpo.affected_reservations.map((r) =>
          reservaAfectadaDesdeBackend(r, datos.espacioId),
        ),
      };
    }
  }
  const error = errorDeRango(datos);
  if (error) {
    throw error;
  }
  return simularRed({
    afectadas: reservasAfectadasPorBloqueo(datos).map((reserva) => ({ ...reserva })),
  });
}

/**
 * Crea el bloqueo y cancela las reservas afectadas avisando a cada solicitante (CA2).
 * Si no hay reservas afectadas, el bloqueo se aplica directo (CA3).
 */
export async function confirmarBloqueo(datos: DatosBloqueo): Promise<ResultadoBloqueo> {
  if (usaApi('bloqueos')) {
    const error = errorDeValidacion(datos);
    if (error) throw error;
    return enviarBloqueo(datos, true);
  }
  const error = errorDeValidacion(datos);
  if (error) {
    throw error;
  }

  const afectadas = reservasAfectadasPorBloqueo(datos);
  const bloqueo: Bloqueo = { ...datos, id: `blo-${Date.now()}` };
  bloqueos = [...bloqueos, bloqueo];

  const canceladas = cancelarReservas(
    afectadas.map((reserva) => reserva.id),
    `Bloqueo institucional: ${datos.motivo.trim()}`,
  );

  return simularRed({
    bloqueo: { ...bloqueo },
    canceladas: canceladas.map((reserva) => ({ ...reserva })),
  });
}

export async function cancelarBloqueo(id: string, motivo: string): Promise<Bloqueo> {
  const reason = motivo.trim();
  if (!reason) throw new ErrorApi(400, 'El motivo de la cancelación es obligatorio.');
  if (usaApi('bloqueos')) {
    return bloqueoDesdeBackend(await peticion<BloqueoBackend>(
      `${RUTA_BLOQUEOS}${encodeURIComponent(id)}/cancel/`,
      { method: 'POST', body: JSON.stringify({ reason }) },
    ));
  }
  const bloqueo = bloqueos.find((elemento) => elemento.id === id);
  if (!bloqueo) throw new ErrorApi(404, 'El bloqueo no existe.');
  if (bloqueo.hasta < hoyISO()) throw new ErrorApi(400, 'El bloqueo ya terminó.');
  bloqueos = bloqueos.filter((elemento) => elemento.id !== id);
  const usuario = useSesion.getState().usuario;
  registrarEvento('bloqueo', id, 'cancelada', usuario?.nombre ?? 'Personal de la biblioteca', reason);
  registrarUso({ id: `uso-bloqueo-${id}`, usuario, servicio: 'espacios', finalidad: reason, estado: 'cancelada' });
  if (usuario) crearNotificacion({ usuarioId: usuario.id, solicitudId: '', titulo: 'Bloqueo quitado', mensaje: reason });
  return simularRed({ ...bloqueo });
}
