/**
 * Bloqueos institucionales de espacios (HU-20).
 * El personal bloquea un espacio por franja, día o rango de fechas; antes ve las reservas
 * afectadas (CA1) y, al confirmar, se cancelan y se avisa a los afectados (CA2). Sin reservas
 * afectadas, el bloqueo se aplica directo (CA3). Los bloqueos aparecen como "bloqueado" en la
 * disponibilidad de HU-17.
 * Las rutas son provisionales: confírmenlas con el equipo de Backend.
 */
import type { Bloqueo, Reserva } from '@/types';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
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
  if (USAR_MOCKS) {
    const lista = espacioId ? bloqueos.filter((b) => b.espacioId === espacioId) : bloqueos;
    return simularRed(lista.map((bloqueo) => ({ ...bloqueo })));
  }
  const consulta = espacioId ? `?espacio=${espacioId}` : '';
  return peticion<Bloqueo[]>(`/bloqueos/${consulta}`);
}

/** Reservas que quedarían afectadas por el bloqueo, antes de confirmarlo (CA1). */
export async function previsualizarBloqueo(datos: DatosBloqueo): Promise<Reserva[]> {
  if (USAR_MOCKS) {
    const error = errorDeRango(datos);
    if (error) {
      throw error;
    }
    return simularRed(reservasAfectadasPorBloqueo(datos).map((reserva) => ({ ...reserva })));
  }
  return peticion<Reserva[]>('/bloqueos/afectadas/', { method: 'POST', body: JSON.stringify(datos) });
}

/**
 * Crea el bloqueo y cancela las reservas afectadas avisando a cada solicitante (CA2).
 * Si no hay reservas afectadas, el bloqueo se aplica directo (CA3).
 */
export async function confirmarBloqueo(datos: DatosBloqueo): Promise<ResultadoBloqueo> {
  if (USAR_MOCKS) {
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
  return peticion<ResultadoBloqueo>('/bloqueos/', { method: 'POST', body: JSON.stringify(datos) });
}
