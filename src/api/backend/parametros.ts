/**
 * Los parámetros generales del Backend traducidos a `Parametros` (HU-28). Funciones puras.
 *
 * El Backend los reparte en cuatro rutas de `config/`:
 * - `periods/` (paginada) y `holidays/` (paginada): públicas;
 * - `schedules/` (arreglo): público. El día va de `0` = lunes a `6` = domingo;
 * - `parameters/` (paginada): solo para quien administra los parámetros. Cada plazo es un código
 *   (`min-notice-days`, `cancel-min-hours`…). Sin acceso, la app usa los valores de siempre, que
 *   son los mismos que siembra el Backend.
 */
import type { Festivo, HorarioAtencion, Parametros, PeriodoAcademico } from '@/types';

import { diaDesdeBackend, horaDesdeBackend } from './equivalencias';

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

export type ParametroBackend = { code: string; value: string; typed_value: unknown };

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
const PLAZOS: Record<string, (valor: number) => Partial<Parametros>> = {
  'min-notice-days': (dias) => ({ horasMinimasSolicitud: dias * 24 }),
  'cancel-min-hours': (horas) => ({ horasMinimasCancelacion: horas }),
  'tablet-max-loan-hours': (horas) => ({ horasMaximasPrestamo: horas }),
  'tablet-loan-hours': (horas) => ({ horasPrestamoTablet: horas }),
  'tablet-max-days-ahead': (dias) => ({ diasMaximosTablet: dias }),
  'tablet-pickup-minutes': (minutos) => ({ minutosRecogerTablet: minutos }),
  'advisory-duration-minutes': (minutos) => ({ duracionAsesoriaMinutos: minutos }),
  'advisory-max-group': (personas) => ({ maximoPersonasAsesoria: personas }),
  'attendance-qr-hours': (horas) => ({ horasVigenciaQr: horas }),
};

/** Los plazos que trae el Backend, sobre los valores de siempre (`base`). */
export function plazosDesdeBackend(valores: ParametroBackend[], base: Parametros): Parametros {
  let resultado = { ...base };
  for (const { code, value, typed_value: tipado } of valores) {
    const numero = typeof tipado === 'number' ? tipado : Number(value);
    const plazo = PLAZOS[code];
    if (plazo && Number.isFinite(numero)) resultado = { ...resultado, ...plazo(numero) };
  }
  return resultado;
}
