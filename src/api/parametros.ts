/**
 * Parámetros generales (HU-28).
 * Consulta y actualiza periodos académicos, festivos, horarios y plazos.
 * La ruta es provisional: confirmarla con el equipo de Backend.
 */
import type { Parametros } from '@/types';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
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

export function obtenerParametros(): Promise<Parametros> {
  if (USAR_MOCKS) {
    return simularRed(clonar(parametros));
  }
  return peticion<Parametros>('/parametros/');
}

export function actualizarParametros(valor: Parametros): Promise<Parametros> {
  if (USAR_MOCKS) {
    const error = validarParametros(valor);
    if (error) {
      return Promise.reject(new ErrorApi(400, error));
    }
    parametros = clonar(valor);
    return simularRed(clonar(parametros));
  }
  return peticion<Parametros>('/parametros/', { method: 'PUT', body: JSON.stringify(valor) });
}
