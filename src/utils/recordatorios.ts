/**
 * Recordatorios de las reservas aprobadas (HU-27, CA2). Funciones puras, sin expo-notifications:
 * deciden cuándo suena cada recordatorio y qué dice. Quien los programa es useRecordatorios.
 *
 * Cada reserva aprobada tiene dos: 24 h antes (con el plazo para cancelar de los parámetros,
 * HU-28) y 1 h antes. Si el momento ya pasó, ese recordatorio no se programa.
 */
import type { Reserva } from '@/types';
import { fechaCompleta } from '@/utils/calendario';

/** Todos los recordatorios de reservas empiezan así; la sincronización solo toca estos. */
export const PREFIJO_RECORDATORIO = 'recordatorio-';

const HORA_MS = 60 * 60 * 1000;

const ANTICIPACIONES = [
  { clave: '24h', horas: 24, titulo: 'Tu reserva es mañana' },
  { clave: '1h', horas: 1, titulo: 'Tu reserva empieza en 1 hora' },
] as const;

export type RecordatorioPlaneado = {
  identificador: string;
  cuando: Date;
  titulo: string;
  cuerpo: string;
};

export type ContextoRecordatorios = {
  /** parametros.textoRecordatorio (HU-28). */
  texto: string;
  /** parametros.horasMinimasCancelacion (HU-28). */
  horasCancelacion: number;
  nombreEspacio: (espacioId: string) => string;
  ahora: Date;
};

const dos = (n: number) => String(n).padStart(2, '0');

/** Fecha y hora de inicio de la reserva, en la hora del celular. */
export function inicioReserva(reserva: Pick<Reserva, 'fecha' | 'horaInicio'>): Date {
  const [anio, mes, dia] = reserva.fecha.split('-').map(Number);
  const [hora, minuto] = reserva.horaInicio.split(':').map(Number);
  return new Date(anio, mes - 1, dia, hora, minuto);
}

/** Date → "martes 27 de octubre a las 14:00". */
function cuandoLegible(fecha: Date): string {
  const dia = `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
  const texto = fechaCompleta(dia);
  const hora = `${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
  return `${texto.charAt(0).toLowerCase()}${texto.slice(1)} a las ${hora}`;
}

/** Los recordatorios de una reserva: solo si está aprobada y el momento aún no pasó. */
export function recordatoriosDeReserva(
  reserva: Reserva,
  { texto, horasCancelacion, nombreEspacio, ahora }: ContextoRecordatorios,
): RecordatorioPlaneado[] {
  if (reserva.estado !== 'aprobada') return [];

  const inicio = inicioReserva(reserva);
  const lugar = nombreEspacio(reserva.espacioId);
  const limiteCancelar = new Date(inicio.getTime() - horasCancelacion * HORA_MS);

  return ANTICIPACIONES.map(({ clave, horas, titulo }) => {
    const cuando = new Date(inicio.getTime() - horas * HORA_MS);
    let detalle: string;
    if (clave === '24h') {
      // El plazo para cancelar solo se menciona si todavía no ha vencido cuando suena.
      const cancelar =
        limiteCancelar > cuando
          ? ` Si no puedes asistir, cancela antes del ${cuandoLegible(limiteCancelar)}.`
          : '';
      detalle = `${lugar}, ${cuandoLegible(inicio)}.${cancelar}`;
    } else {
      detalle = `${lugar}, hoy a las ${reserva.horaInicio}.`;
    }
    return {
      identificador: `${PREFIJO_RECORDATORIO}${reserva.id}-${clave}`,
      cuando,
      titulo,
      cuerpo: `${texto} ${detalle}`,
    };
  }).filter((recordatorio) => recordatorio.cuando > ahora);
}

/** Todos los recordatorios de las reservas, del más próximo al más lejano. */
export function planRecordatorios(
  reservas: Reserva[],
  contexto: ContextoRecordatorios,
): RecordatorioPlaneado[] {
  return reservas
    .flatMap((reserva) => recordatoriosDeReserva(reserva, contexto))
    .sort((a, b) => a.cuando.getTime() - b.cuando.getTime());
}

/** El recordatorio de ejemplo del botón "Probar un recordatorio". */
export function ejemploRecordatorio(texto: string): Pick<RecordatorioPlaneado, 'titulo' | 'cuerpo'> {
  return {
    titulo: 'Recordatorio de prueba',
    cuerpo: `${texto} Así te avisaremos 24 horas y 1 hora antes de cada reserva aprobada.`,
  };
}
