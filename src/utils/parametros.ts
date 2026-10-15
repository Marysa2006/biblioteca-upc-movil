/**
 * Reglas de los parámetros generales (HU-28).
 * CA3: un día festivo no se ofrece para reservas ni citas.
 */
import type { Parametros } from '@/types';

/** ¿La fecha (ISO 'AAAA-MM-DD') es un día festivo configurado? */
export function esFestivo(fecha: string, parametros: Parametros): boolean {
  return parametros.festivos.some((festivo) => festivo.fecha === fecha);
}

/** ¿La fecha es un día hábil? No es festivo y el día tiene horario de atención. */
export function esDiaHabil(fecha: string, parametros: Parametros): boolean {
  if (esFestivo(fecha, parametros)) {
    return false;
  }
  const dia = new Date(`${fecha}T00:00:00`).getDay();
  return parametros.horarios.some((horario) => horario.dia === dia);
}
