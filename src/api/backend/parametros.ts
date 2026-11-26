/**
 * Los parámetros generales del Backend traducidos a `Parametros` (HU-28). Funciones puras.
 *
 * El Backend los reparte en cuatro rutas de `config/`:
 * - `periods/` (paginada) y `holidays/` (paginada): públicas;
 * - `schedules/` (arreglo): público. El día va de `0` = lunes a `6` = domingo;
 * - `parameters/` (paginada): solo para quien administra los parámetros. Cada plazo es un código
 *   (`min-notice-days`, `cancel-min-hours`…). Para la comunidad se leen los valores publicados por config/rules/.
 */
import type { Festivo, HorarioAtencion, Parametros, PeriodoAcademico } from '@/types';

import { diaDesdeBackend, diaHaciaBackend, horaDesdeBackend } from './equivalencias';

export type PeriodoBackend = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
};

export type FestivoBackend = { id: number; date: string; name: string };

export type HorarioBackend = {
  id: number;
  day_of_week: number;
  opening_time: string;
  closing_time: string;
  is_active?: boolean;
};

export type ParametroBackend = {
  code: string;
  value: string;
  typed_value: unknown;
  data_type?: 'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'DATE' | 'TIME';
};

export function periodoDesdeBackend(periodo: PeriodoBackend): PeriodoAcademico {
  return {
    id: String(periodo.id),
    nombre: periodo.name,
    inicio: periodo.start_date,
    fin: periodo.end_date,
  };
}

export function festivoDesdeBackend(festivo: FestivoBackend): Festivo {
  return { fecha: festivo.date, motivo: festivo.name };
}

/** Solo las franjas activas, con el día y las horas como los usa la app. */
export function horariosDesdeBackend(horarios: HorarioBackend[]): HorarioAtencion[] {
  return horarios
    .filter((horario) => horario.is_active !== false)
    .map((horario) => ({
      dia: diaDesdeBackend(horario.day_of_week),
      abre: horaDesdeBackend(horario.opening_time),
      cierra: horaDesdeBackend(horario.closing_time),
    }));
}

/**
 * Cada código del Backend y el campo de la app que llena. `min-notice-days` viene en días y la
 * app lo guarda en horas.
 */
type CampoPlazo = {
  [Campo in keyof Parametros]: Parametros[Campo] extends number | null ? Campo : never;
}[keyof Parametros];

const PLAZOS: Record<string, { campo: CampoPlazo; factor: number }> = {
  'min-notice-days': { campo: 'horasMinimasSolicitud', factor: 24 },
  'cancel-min-hours': { campo: 'horasMinimasCancelacion', factor: 1 },
  'tablet-max-loan-hours': { campo: 'horasMaximasPrestamo', factor: 1 },
  'tablet-loan-hours': { campo: 'horasPrestamoTablet', factor: 1 },
  'tablet-max-days-ahead': { campo: 'diasMaximosTablet', factor: 1 },
  'tablet-pickup-minutes': { campo: 'minutosRecogerTablet', factor: 1 },
  'advisory-duration-minutes': { campo: 'duracionAsesoriaMinutos', factor: 1 },
  'advisory-max-group': { campo: 'maximoPersonasAsesoria', factor: 1 },
  'attendance-qr-hours': { campo: 'horasVigenciaQr', factor: 1 },
};

/** Los plazos que trae el Backend, sobre las reglas públicas (`base`). */
export function plazosDesdeBackend(valores: ParametroBackend[], base: Parametros): Parametros {
  const resultado = { ...base };
  for (const { code, value, typed_value: tipado } of valores) {
    const numero = typeof tipado === 'number' ? tipado : Number(value);
    const plazo = PLAZOS[code];
    if (plazo && Number.isFinite(numero)) resultado[plazo.campo] = numero * plazo.factor;
  }
  return resultado;
}

export function plazosHaciaBackend(deseados: Parametros, actuales: Parametros) {
  return Object.entries(PLAZOS)
    .flatMap(([code, { campo, factor }]) => {
      const valor = deseados[campo];
      return valor != null && valor !== actuales[campo] ? [{ code, value: valor / factor }] : [];
    });
}

export function periodoHaciaBackend(periodo: PeriodoAcademico) {
  return { name: periodo.nombre.trim(), start_date: periodo.inicio, end_date: periodo.fin };
}

export function festivoHaciaBackend(festivo: Festivo) {
  return { date: festivo.fecha, name: festivo.motivo.trim() };
}

export function horarioHaciaBackend(horario: HorarioAtencion) {
  return {
    day_of_week: diaHaciaBackend(horario.dia),
    opening_time: horario.abre,
    closing_time: horario.cierra,
  };
}
