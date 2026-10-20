/**
 * Fechas y horas como texto (AAAA-MM-DD y HH:MM), sin paquetes de calendario.
 * Las usan los avisos (HU-04) y los parámetros generales (HU-28). Funciones puras.
 */

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** true si el texto es una fecha real en formato AAAA-MM-DD (por ejemplo, rechaza 2026-02-30). */
export function esFechaValida(texto: string): boolean {
  if (!FECHA.test(texto)) return false;
  const [anio, mes, dia] = texto.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
}

/** true si el texto es una hora de 00:00 a 23:59. */
export function esHoraValida(texto: string): boolean {
  return HORA.test(texto);
}

/** Fecha de hoy en formato AAAA-MM-DD, en la hora del celular. */
export function hoyISO(): string {
  const hoy = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${hoy.getFullYear()}-${dos(hoy.getMonth() + 1)}-${dos(hoy.getDate())}`;
}

/** Nombres de los meses en minúscula, de enero (0) a diciembre (11). */
export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** 2026-10-17 → "17 de octubre". */
export function fechaLegible(texto: string): string {
  const [, mes, dia] = texto.split('-').map(Number);
  return `${dia} de ${MESES[mes - 1]}`;
}
