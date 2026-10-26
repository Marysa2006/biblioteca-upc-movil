/**
 * Asesorías: temas y jornadas del personal (HU-13).
 * Lista y guarda temas y jornadas; al guardar una jornada genera sus franjas (CA1).
 * Las rutas son provisionales: confírmenlas con el equipo de Backend.
 */
import type { Jornada, Parametros, TemaAsesoria } from '@/types';
import { esFechaValida, esHoraValida } from '@/utils/fechas';
import { aMinutos, generarFranjas } from '@/utils/franjas';
import { problemaHorario } from '@/utils/reservas';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { FRANJAS_ASESORIA, JORNADAS_ASESORIA, TEMAS_ASESORIA } from './mocks/asesorias';
import { obtenerParametros } from './parametros';

/** Copias mutables: con mocks, lo que se crea o edita se ve durante la sesión. */
let temas: TemaAsesoria[] = TEMAS_ASESORIA.map((tema) => ({ ...tema }));
let jornadas: Jornada[] = JORNADAS_ASESORIA.map((jornada) => ({ ...jornada }));
let franjas = FRANJAS_ASESORIA.map((franja) => ({ ...franja }));

/** Datos del formulario de un tema; sin id crea y con id edita. */
export type DatosTema = Omit<TemaAsesoria, 'id'> & { id?: string };

/** Datos del formulario de una jornada; sin id crea y con id edita. */
export type DatosJornada = Omit<Jornada, 'id'> & { id?: string };

/** Resultado de guardar una jornada (CA1): cuántas franjas generó. */
export type ResultadoJornada = {
  jornada: Jornada;
  franjasGeneradas: number;
};

/** Todos los temas, también los inactivos, para la administración (HU-13). */
export function obtenerTemas(): Promise<TemaAsesoria[]> {
  if (USAR_MOCKS) {
    return simularRed(temas.map((tema) => ({ ...tema })));
  }
  return peticion<TemaAsesoria[]>('/asesorias/temas/');
}

export function guardarTema(datos: DatosTema): Promise<TemaAsesoria> {
  if (USAR_MOCKS) {
    if (!datos.nombre?.trim()) {
      return Promise.reject(new ErrorApi(400, 'El nombre del tema es obligatorio.'));
    }
    if (datos.id) {
      const indice = temas.findIndex((tema) => tema.id === datos.id);
      if (indice === -1) {
        return Promise.reject(new ErrorApi(404, 'El tema no existe.'));
      }
      const actualizado: TemaAsesoria = { ...datos, id: datos.id };
      temas = temas.map((tema, i) => (i === indice ? actualizado : tema));
      return simularRed({ ...actualizado });
    }
    const nuevo: TemaAsesoria = { ...datos, id: `tema-${Date.now()}` };
    temas = [...temas, nuevo];
    return simularRed({ ...nuevo });
  }
  return datos.id
    ? peticion<TemaAsesoria>(`/asesorias/temas/${datos.id}/`, {
        method: 'PUT',
        body: JSON.stringify(datos),
      })
    : peticion<TemaAsesoria>('/asesorias/temas/', {
        method: 'POST',
        body: JSON.stringify(datos),
      });
}

/** Todas las jornadas, para la administración (HU-13). */
export function obtenerJornadas(): Promise<Jornada[]> {
  if (USAR_MOCKS) {
    return simularRed(jornadas.map((jornada) => ({ ...jornada })));
  }
  return peticion<Jornada[]>('/asesorias/jornadas/');
}

/** Validación de la jornada: datos coherentes y sin traslape con otra del facilitador (CA2). */
function errorDeJornada(datos: DatosJornada): ErrorApi | null {
  if (!datos.temaId) {
    return new ErrorApi(400, 'Elige el tema.');
  }
  if (!datos.facilitadorId) {
    return new ErrorApi(400, 'Elige el facilitador.');
  }
  if (datos.dias.length === 0) {
    return new ErrorApi(400, 'Elige al menos un día.');
  }
  if (datos.dias.some((dia) => !Number.isInteger(dia) || dia < 0 || dia > 6)) {
    return new ErrorApi(400, 'Los días de la semana no son válidos.');
  }
  if (datos.modalidad !== 'presencial' && datos.modalidad !== 'virtual') {
    return new ErrorApi(400, 'La modalidad no es válida.');
  }
  if (!esHoraValida(datos.horaInicio) || !esHoraValida(datos.horaFin)) {
    return new ErrorApi(400, 'Usa el formato HH:MM en el horario.');
  }
  const problema = problemaHorario(datos.horaInicio, datos.horaFin);
  if (problema) {
    return new ErrorApi(400, problema.mensaje);
  }
  if (!Number.isInteger(datos.duracionMinutos) || datos.duracionMinutos <= 0) {
    return new ErrorApi(400, 'La duración de la franja debe ser mayor que cero.');
  }
  if (!Number.isInteger(datos.cupos) || datos.cupos < 1) {
    return new ErrorApi(400, 'Los cupos por franja deben ser al menos 1.');
  }
  if (!esFechaValida(datos.vigenciaDesde) || !esFechaValida(datos.vigenciaHasta)) {
    return new ErrorApi(400, 'Usa el formato AAAA-MM-DD en la vigencia.');
  }
  if (datos.vigenciaDesde > datos.vigenciaHasta) {
    return new ErrorApi(400, 'La vigencia está cruzada.');
  }
  if (aMinutos(datos.horaInicio) + datos.duracionMinutos > aMinutos(datos.horaFin)) {
    return new ErrorApi(400, 'La franja no cabe en el horario de la jornada.');
  }
  const choca = jornadas.some(
    (jornada) =>
      jornada.id !== datos.id &&
      jornada.activa &&
      datos.activa &&
      jornada.facilitadorId === datos.facilitadorId &&
      jornada.dias.some((dia) => datos.dias.includes(dia)) &&
      jornada.vigenciaDesde <= datos.vigenciaHasta &&
      datos.vigenciaDesde <= jornada.vigenciaHasta &&
      aMinutos(datos.horaInicio) < aMinutos(jornada.horaFin) &&
      aMinutos(jornada.horaInicio) < aMinutos(datos.horaFin),
  );
  if (choca) {
    return new ErrorApi(400, 'La jornada se traslapa con otra del mismo facilitador.');
  }
  return null;
}

/**
 * Crea o edita una jornada y genera sus franjas (CA1), sin las fechas excluidas (CA3).
 * Devuelve la jornada y cuántas franjas quedaron.
 */
export async function guardarJornada(datos: DatosJornada): Promise<ResultadoJornada> {
  if (USAR_MOCKS) {
    if (datos.id && !jornadas.some((actual) => actual.id === datos.id)) {
      throw new ErrorApi(404, 'La jornada no existe.');
    }
    const error = errorDeJornada(datos);
    if (error) {
      throw error;
    }
    const id = datos.id ?? `jor-${Date.now()}`;
    const jornada: Jornada = { ...datos, id };
    const parametros: Parametros = await obtenerParametros();
    const nuevas = generarFranjas(jornada, parametros);

    // Reemplaza las franjas de esta jornada y conserva las de las demás.
    franjas = [...franjas.filter((franja) => franja.jornadaId !== id), ...nuevas];

    if (datos.id) {
      jornadas = jornadas.map((actual) => (actual.id === datos.id ? jornada : actual));
    } else {
      jornadas = [...jornadas, jornada];
    }

    return simularRed({ jornada: { ...jornada }, franjasGeneradas: nuevas.length });
  }
  return datos.id
    ? peticion<ResultadoJornada>(`/asesorias/jornadas/${datos.id}/`, {
        method: 'PUT',
        body: JSON.stringify(datos),
      })
    : peticion<ResultadoJornada>('/asesorias/jornadas/', {
        method: 'POST',
        body: JSON.stringify(datos),
      });
}
