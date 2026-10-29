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

/** "09:00" + 1 → "10:00". Si pasa de la medianoche, se queda en "23:00". */
export function sumarHoras(hora: string, horas: number): string {
  const [h, m] = hora.split(':').map(Number);
  const total = Math.min(h + horas, 23);
  return `${String(total).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Por defecto, las horas que se eligen con el reloj van cada 30 minutos. */
export const MINUTOS_PASO_HORA = 30;

/**
 * Hora y minuto del reloj → "HH:MM" en el múltiplo del paso más cercano (30 o 60 minutos).
 * Con 30: 14:37 → "14:30" (ajustada); 23:50 se queda en "23:30" para no pasar al día siguiente.
 * Con 60: 14:37 → "15:00".
 */
export function horaAlPaso(
  hora: number,
  minuto: number,
  paso: number = MINUTOS_PASO_HORA,
): { hora: string; ajustada: boolean } {
  const ultima = Math.floor((24 * 60 - 1) / paso) * paso;
  const total = Math.min(Math.round((hora * 60 + minuto) / paso) * paso, ultima);
  const dos = (n: number) => String(n).padStart(2, '0');
  return {
    hora: `${dos(Math.floor(total / 60))}:${dos(total % 60)}`,
    ajustada: total !== hora * 60 + minuto,
  };
}
