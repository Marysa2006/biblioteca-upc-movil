/**
 * Generación de franjas de una jornada de asesoría (HU-13, CA1 y CA3).
 * Funciones puras: no dependen de la API ni de la sesión.
 *
 * Las franjas son los días de la semana de la jornada dentro de su vigencia, divididos por
 * la duración, sin las fechas excluidas (CA3) ni los días no hábiles (HU-28).
 */
import type { FranjaAsesoria, Jornada, Parametros } from '@/types';
import { esDiaHabil } from '@/utils/parametros';

/** 'HH:MM' → minutos desde las 00:00. */
export function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** Minutos desde las 00:00 → 'HH:MM'. */
export function aHora(minutos: number): string {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0');
  const m = String(minutos % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/** Fechas 'AAAA-MM-DD' del rango, ambas incluidas. */
function fechasEntre(desde: string, hasta: string): string[] {
  const [a, m, d] = desde.split('-').map(Number);
  const [af, mf, df] = hasta.split('-').map(Number);
  const cursor = new Date(Date.UTC(a, m - 1, d));
  const fin = new Date(Date.UTC(af, mf - 1, df));
  const fechas: string[] = [];
  while (cursor <= fin) {
    fechas.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return fechas;
}

/** Id estable de una franja: jornada + fecha + hora de inicio. */
export function idFranja(jornadaId: string, fecha: string, horaInicio: string): string {
  return `fran-${jornadaId}-${fecha}-${horaInicio.replace(':', '')}`;
}

/**
 * Franjas de una jornada (CA1). No genera nada si el horario o la duración no son válidos;
 * la API valida antes de guardar.
 */
export function generarFranjas(jornada: Jornada, parametros: Parametros): FranjaAsesoria[] {
  const abre = aMinutos(jornada.horaInicio);
  const cierra = aMinutos(jornada.horaFin);
  const paso = jornada.duracionMinutos;
  if (paso <= 0 || abre >= cierra) {
    return [];
  }

  const franjas: FranjaAsesoria[] = [];
  for (const fecha of fechasEntre(jornada.vigenciaDesde, jornada.vigenciaHasta)) {
    const dia = new Date(`${fecha}T00:00:00`).getDay();
    if (!jornada.dias.includes(dia)) continue;
    if (jornada.excepciones.includes(fecha)) continue;
    if (!esDiaHabil(fecha, parametros)) continue;

    for (let inicio = abre; inicio + paso <= cierra; inicio += paso) {
      const horaInicio = aHora(inicio);
      franjas.push({
        id: idFranja(jornada.id, fecha, horaInicio),
        jornadaId: jornada.id,
        temaId: jornada.temaId,
        facilitadorId: jornada.facilitadorId,
        fecha,
        horaInicio,
        horaFin: aHora(inicio + paso),
        cuposLibres: jornada.cupos,
      });
    }
  }
  return franjas;
}

/**
 * Al regenerar las franjas de una jornada (HU-13), conserva las que ya existían en el mismo
 * día y hora: mantiene su id (para no romper las citas de HU-14) y descuenta los cupos ya
 * ocupados. Las franjas nuevas quedan con el cupo completo.
 */
export function conservarFranjas(
  nuevas: FranjaAsesoria[],
  anteriores: FranjaAsesoria[],
  cuposAnteriores: number,
): FranjaAsesoria[] {
  const porDiaYHora = new Map(
    anteriores.map((franja) => [`${franja.fecha} ${franja.horaInicio}`, franja]),
  );
  return nuevas.map((franja) => {
    const anterior = porDiaYHora.get(`${franja.fecha} ${franja.horaInicio}`);
    if (!anterior) {
      return franja;
    }
    const ocupados = Math.max(0, cuposAnteriores - anterior.cuposLibres);
    return {
      ...franja,
      id: anterior.id,
      cuposLibres: Math.max(0, franja.cuposLibres - ocupados),
    };
  });
}
