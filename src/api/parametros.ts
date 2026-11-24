/**
 * Parámetros generales (HU-28).
 * Consulta y actualiza periodos académicos, festivos, horarios y plazos.
 *
 * Con la API (módulo `parametros` de `usaApi()`), se leen de `config/` del Backend
 * (src/api/backend/parametros.ts). Todos los calendarios de la app dependen de esto: los días
 * hábiles salen de los horarios y los festivos (`esDiaHabil()`).
 * Guardar con la API llega con la administración (fase 4 de la integración): mientras tanto,
 * con el módulo activo, la app no guarda para no mostrar cambios que el servidor no tiene.
 */
import { useSesion } from '@/store/sesion';
import type { Festivo, Parametros, PeriodoAcademico } from '@/types';
import { tienePermiso } from '@/utils/roles';

import {
  festivoDesdeBackend,
  horariosDesdeBackend,
  periodoDesdeBackend,
  plazosDesdeBackend,
  type FestivoBackend,
  type HorarioBackend,
  type ParametroBackend,
  type PeriodoBackend,
} from './backend/parametros';
import { ErrorApi, peticion, peticionTodas, simularRed, usaApi } from './cliente';
import { PARAMETROS } from './mocks/parametros';

function clonar(valor: Parametros): Parametros {
  return JSON.parse(JSON.stringify(valor)) as Parametros;
}

/** Copia mutable: con mocks, los cambios se ven durante la sesión de la app. */
let parametros: Parametros = clonar(PARAMETROS);

/**
 * Validación de consistencia de la HU-28 (CA2): fechas cruzadas, horarios
 * incoherentes y plazos negativos. Devuelve el mensaje de error o null si está bien.
 */
export function validarParametros(valor: Parametros): string | null {
  for (const periodo of valor.periodos) {
    if (!periodo.nombre?.trim()) {
      return 'Cada periodo necesita un nombre.';
    }
    if (periodo.inicio > periodo.fin) {
      return `El periodo "${periodo.nombre}" tiene las fechas cruzadas.`;
    }
  }
  for (const horario of valor.horarios) {
    if (horario.abre >= horario.cierra) {
      return 'Hay un horario que cierra antes de abrir.';
    }
  }
  if (valor.horasMinimasSolicitud < 0 || valor.horasMinimasCancelacion < 0) {
    return 'Los tiempos mínimos no pueden ser negativos.';
  }
  return null;
}

/**
 * Los plazos del Backend, solo para quien los administra: los demás reciben 403 (o 401 sin
 * sesión) y la app usa los valores de siempre.
 */
async function leerPlazos(): Promise<ParametroBackend[]> {
  if (!tienePermiso(useSesion.getState().usuario, 'parametros')) return [];
  try {
    return await peticionTodas<ParametroBackend, ParametroBackend>(
      '/config/parameters/',
      (parametro) => parametro,
    );
  } catch (error) {
    if (error instanceof ErrorApi && (error.estado === 401 || error.estado === 403)) return [];
    throw error;
  }
}

export async function obtenerParametros(): Promise<Parametros> {
  if (!usaApi('parametros')) {
    return simularRed(clonar(parametros));
  }
  const [periodos, festivos, horarios, plazos] = await Promise.all([
    peticionTodas<PeriodoBackend, PeriodoAcademico>('/config/periods/', periodoDesdeBackend),
    peticionTodas<FestivoBackend, Festivo>('/config/holidays/', festivoDesdeBackend),
    peticion<HorarioBackend[]>('/config/schedules/'),
    leerPlazos(),
  ]);
  // Los textos de las comunicaciones no están en el Backend (son sus plantillas de correo).
  return plazosDesdeBackend(plazos, {
    ...clonar(PARAMETROS),
    periodos,
    festivos,
    horarios: horariosDesdeBackend(horarios),
  });
}

export function actualizarParametros(valor: Parametros): Promise<Parametros> {
  if (!usaApi('parametros')) {
    const error = validarParametros(valor);
    if (error) {
      return Promise.reject(new ErrorApi(400, error));
    }
    parametros = clonar(valor);
    return simularRed(clonar(parametros));
  }
  return Promise.reject(
    new ErrorApi(
      400,
      'Por ahora los parámetros se consultan del servidor, pero todavía no se guardan desde la app.',
    ),
  );
}
