/**
 * Recordatorios de las reservas aprobadas (HU-27, CA2), de las citas de asesoría y de los
 * préstamos de tablet (HU-24 y HU-30). Funciones puras, sin expo-notifications: deciden cuándo
 * suena cada recordatorio y qué dice. Quien los programa es useRecordatorios.
 *
 * Cada reserva y cada cita aprobada tienen uno, 3 días antes, con el plazo para cancelar de los
 * parámetros (HU-28): así lo pidió la biblioteca el 15 de noviembre de 2026, en lugar de los de
 * 24 h y 1 h. Un préstamo reservado tiene uno 1 hora antes de recoger la tablet, y uno entregado,
 * 30 minutos antes de la hora límite (HU-24, CA2). La anticipación es fija por ahora. Si el
 * momento ya pasó (por ejemplo, una solicitud aprobada a menos de 3 días), no se programa: la
 * notificación de «aprobada» ya le avisa a la persona.
 */
import type { Cita, Prestamo, Reserva } from '@/types';
import { fechaCompleta } from '@/utils/calendario';

/** Todos los recordatorios (reservas, citas y préstamos) empiezan así; la sincronización solo toca estos. */
export const PREFIJO_RECORDATORIO = 'recordatorio-';

const HORA_MS = 60 * 60 * 1000;

/** Cuántas horas antes suena el recordatorio de una reserva o una cita: 3 días. */
const HORAS_ANTES = 72;
const CLAVE = '3d';

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

/**
 * Cuándo suena el recordatorio de algo que empieza en `inicio`, y la frase con el plazo para
 * cancelar. El plazo solo se menciona si todavía no ha vencido cuando suena.
 */
function momentoYPlazo(inicio: Date, horasCancelacion: number) {
  const cuando = new Date(inicio.getTime() - HORAS_ANTES * HORA_MS);
  const limiteCancelar = new Date(inicio.getTime() - horasCancelacion * HORA_MS);
  const cancelar =
    limiteCancelar > cuando
      ? ` Si no puedes asistir, cancela antes del ${cuandoLegible(limiteCancelar)}.`
      : '';
  return { cuando, cancelar };
}

/** El recordatorio de una reserva: solo si está aprobada y el momento aún no pasó. */
export function recordatoriosDeReserva(
  reserva: Reserva,
  { texto, horasCancelacion, nombreEspacio, ahora }: ContextoRecordatorios,
): RecordatorioPlaneado[] {
  if (reserva.estado !== 'aprobada') return [];

  const inicio = inicioReserva(reserva);
  const { cuando, cancelar } = momentoYPlazo(inicio, horasCancelacion);
  if (cuando <= ahora) return [];

  const lugar = nombreEspacio(reserva.espacioId);
  return [
    {
      identificador: `${PREFIJO_RECORDATORIO}${reserva.id}-${CLAVE}`,
      cuando,
      titulo: 'Tu reserva es en 3 días',
      cuerpo: `${texto} ${lugar}, ${cuandoLegible(inicio)}.${cancelar}`,
    },
  ];
}

/** El recordatorio de una cita de asesoría: solo si está aprobada y el momento aún no pasó (HU-30). */
export function recordatoriosDeCita(
  cita: Cita,
  {
    texto,
    horasCancelacion,
    ahora,
  }: Pick<ContextoRecordatorios, 'texto' | 'horasCancelacion' | 'ahora'>,
): RecordatorioPlaneado[] {
  if (cita.estado !== 'aprobada') return [];

  const inicio = inicioReserva(cita);
  const { cuando, cancelar } = momentoYPlazo(inicio, horasCancelacion);
  if (cuando <= ahora) return [];

  const modalidad = cita.modalidad === 'virtual' ? ' (virtual)' : '';
  return [
    {
      identificador: `${PREFIJO_RECORDATORIO}cita-${cita.id}-${CLAVE}`,
      cuando,
      titulo: 'Tu asesoría es en 3 días',
      cuerpo: `${texto} ${cita.tema}${cita.facilitador ? ` con ${cita.facilitador}` : ''}${modalidad}, ${cuandoLegible(inicio)}.${cancelar}`,
    },
  ];
}

/** Minutos antes de la hora límite en que suena el recordatorio de devolver (HU-24). */
const MINUTOS_ANTES_LIMITE = 30;

/** Minutos antes de la hora de inicio en que suena el recordatorio de recoger (HU-30). */
const MINUTOS_ANTES_RECOGER = 60;

/**
 * El recordatorio de un préstamo de tablet, si aún no suena: recogerla 1 hora antes si está
 * reservado (HU-30) o devolverla 30 minutos antes de la hora límite si está entregado (HU-24).
 * Devuelto, cancelado o vencido no tienen; el vencido ya lo avisa HU-24.
 */
export function recordatoriosDePrestamo(
  prestamo: Prestamo,
  { texto, ahora }: Pick<ContextoRecordatorios, 'texto' | 'ahora'>,
): RecordatorioPlaneado[] {
  let recordatorio: RecordatorioPlaneado;
  if (prestamo.estado === 'reservado') {
    const inicio = inicioReserva(prestamo);
    recordatorio = {
      identificador: `${PREFIJO_RECORDATORIO}prestamo-${prestamo.id}-recoger`,
      cuando: new Date(inicio.getTime() - MINUTOS_ANTES_RECOGER * 60 * 1000),
      titulo: 'Recoge tu tablet',
      cuerpo: `${texto} Tu tablet te espera hoy a las ${prestamo.horaInicio}. Recógela en el mostrador.`,
    };
  } else if (prestamo.estado === 'entregado') {
    const limite = inicioReserva({ fecha: prestamo.fecha, horaInicio: prestamo.horaLimite });
    recordatorio = {
      identificador: `${PREFIJO_RECORDATORIO}prestamo-${prestamo.id}-devolver`,
      cuando: new Date(limite.getTime() - MINUTOS_ANTES_LIMITE * 60 * 1000),
      titulo: `Devuelve la tablet antes de las ${prestamo.horaLimite}`,
      cuerpo: `${texto} Tu préstamo de tablet vence hoy a las ${prestamo.horaLimite}. Devuélvela en el mostrador con sus accesorios.`,
    };
  } else {
    return [];
  }
  return recordatorio.cuando > ahora ? [recordatorio] : [];
}

/**
 * Todos los recordatorios, del más próximo al más lejano. La sincronización cancela los que
 * no están aquí: los de las citas y los préstamos tienen que entrar en el mismo plan.
 */
export function planRecordatorios(
  reservas: Reserva[],
  contexto: ContextoRecordatorios,
  prestamos: Prestamo[] = [],
  citas: Cita[] = [],
): RecordatorioPlaneado[] {
  return [
    ...reservas.flatMap((reserva) => recordatoriosDeReserva(reserva, contexto)),
    ...citas.flatMap((cita) => recordatoriosDeCita(cita, contexto)),
    ...prestamos.flatMap((prestamo) => recordatoriosDePrestamo(prestamo, contexto)),
  ].sort((a, b) => a.cuando.getTime() - b.cuando.getTime());
}

/** El recordatorio de ejemplo del botón "Probar un recordatorio". */
export function ejemploRecordatorio(texto: string): Pick<RecordatorioPlaneado, 'titulo' | 'cuerpo'> {
  return {
    titulo: 'Recordatorio de prueba',
    cuerpo: `${texto} Así te avisaremos antes de tus reservas, asesorías y préstamos de tablet.`,
  };
}
