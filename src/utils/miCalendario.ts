/**
 * Mi calendario (HU-30, CA1): las reservas, las asesorías y los préstamos de tablet de la
 * persona, como "compromisos" con fecha, hora, lugar y tipo de servicio. Funciones puras.
 * Solo entra lo que la persona tiene que cumplir: reservas y citas aprobadas, y préstamos con
 * la tablet en sus manos (entregados o vencidos). Los mismos que tienen recordatorio.
 * Los días y la semana (de lunes a sábado) son los de la agenda (src/utils/agenda.ts).
 */
import type { CategoriaServicio, Cita, Prestamo, Reserva } from '@/types';
import { NOMBRE_MODALIDAD } from '@/utils/jornadas';

export type TipoCompromiso = 'reserva' | 'asesoria' | 'tablet';

export type Compromiso = {
  /** Único entre los tres tipos: 'reserva-<id>', 'asesoria-<id>' o 'tablet-<id>'. */
  id: string;
  tipo: TipoCompromiso;
  /** 'AAAA-MM-DD' y 'HH:MM'. En la tablet, horaFin es la hora límite para devolverla. */
  fecha: string;
  horaInicio: string;
  horaFin: string;
  titulo: string;
  lugar: string;
  /** Un dato más: con quién es la asesoría o qué hay que hacer con la tablet. */
  detalle?: string;
  /** El préstamo pasó la hora límite y la tablet no se ha devuelto. */
  vencido?: boolean;
};

/** El tipo de servicio de cada compromiso, para su color (acentoServicio) y su fondo. */
export const CATEGORIA_COMPROMISO: Record<TipoCompromiso, CategoriaServicio> = {
  reserva: 'espacios',
  asesoria: 'asesorias',
  tablet: 'tablets',
};

/** El color nunca va solo: cada tipo lleva su ícono y su nombre. */
export const ICONO_COMPROMISO: Record<TipoCompromiso, string> = {
  reserva: 'door-open',
  asesoria: 'account-voice',
  tablet: 'tablet',
};

export const NOMBRE_COMPROMISO: Record<TipoCompromiso, string> = {
  reserva: 'Reserva',
  asesoria: 'Asesoría',
  tablet: 'Tablet',
};

/** Orden de los tipos en el conteo de cada día y en las convenciones. */
export const TIPOS_COMPROMISO: TipoCompromiso[] = ['reserva', 'asesoria', 'tablet'];

const LUGAR_TABLET = 'Mostrador de la biblioteca';

export type FuentesCalendario = {
  reservas: Reserva[];
  citas: Cita[];
  prestamos: Prestamo[];
  /** El nombre de un espacio por su id; si no se encuentra, un texto genérico. */
  nombreEspacio: (espacioId: string) => string;
};

/** Todos los compromisos, por fecha y hora. */
export function compromisos({ reservas, citas, prestamos, nombreEspacio }: FuentesCalendario): Compromiso[] {
  const deReservas = reservas
    .filter((reserva) => reserva.estado === 'aprobada')
    .map<Compromiso>((reserva) => ({
      id: `reserva-${reserva.id}`,
      tipo: 'reserva',
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      titulo: reserva.proposito,
      lugar: nombreEspacio(reserva.espacioId),
    }));

  const deCitas = citas
    .filter((cita) => cita.estado === 'aprobada')
    .map<Compromiso>((cita) => ({
      id: `asesoria-${cita.id}`,
      tipo: 'asesoria',
      fecha: cita.fecha,
      horaInicio: cita.horaInicio,
      horaFin: cita.horaFin,
      titulo: cita.tema,
      lugar: cita.modalidad === 'virtual' ? NOMBRE_MODALIDAD.virtual : 'Biblioteca (presencial)',
      detalle: `Con ${cita.facilitador}`,
    }));

  const dePrestamos = prestamos
    .filter((prestamo) => prestamo.estado === 'entregado' || prestamo.estado === 'vencido')
    .map<Compromiso>((prestamo) => {
      const vencido = prestamo.estado === 'vencido';
      return {
        id: `tablet-${prestamo.id}`,
        tipo: 'tablet',
        fecha: prestamo.fecha,
        horaInicio: prestamo.horaInicio,
        horaFin: prestamo.horaLimite,
        titulo: 'Préstamo de tablet',
        lugar: LUGAR_TABLET,
        detalle: vencido
          ? 'Ya pasó la hora límite: devuélvela cuanto antes.'
          : `Devuélvela antes de las ${prestamo.horaLimite}.`,
        vencido,
      };
    });

  return [...deReservas, ...deCitas, ...dePrestamos].sort((a, b) =>
    a.fecha === b.fecha ? a.horaInicio.localeCompare(b.horaInicio) : a.fecha.localeCompare(b.fecha),
  );
}

/** Los compromisos de un día (vista Día). */
export const compromisosDelDia = (lista: Compromiso[], fecha: string) =>
  lista.filter((compromiso) => compromiso.fecha === fecha);

export type DiaCompromisos = { fecha: string; compromisos: Compromiso[] };

/** Agrupados por día, en orden (vista Semana). Los días sin compromisos no aparecen. */
export function agruparPorDia(lista: Compromiso[]): DiaCompromisos[] {
  const dias: DiaCompromisos[] = [];
  for (const compromiso of lista) {
    const ultimo = dias[dias.length - 1];
    if (ultimo && ultimo.fecha === compromiso.fecha) ultimo.compromisos.push(compromiso);
    else dias.push({ fecha: compromiso.fecha, compromisos: [compromiso] });
  }
  return dias;
}

/** Los compromisos de un día: el total y cuántos hay de cada tipo, en el orden de TIPOS_COMPROMISO. */
export type ConteoTipos = {
  total: number;
  tipos: { tipo: TipoCompromiso; cantidad: number }[];
};

/** Cuántos compromisos de cada tipo tiene cada día, para la tira de días y el mes. */
export function contarPorDia(lista: Compromiso[]): Map<string, ConteoTipos> {
  const conteo = new Map<string, ConteoTipos>();
  for (const fecha of new Set(lista.map((compromiso) => compromiso.fecha))) {
    const delDia = compromisosDelDia(lista, fecha);
    const tipos = TIPOS_COMPROMISO.map((tipo) => ({
      tipo,
      cantidad: delDia.filter((compromiso) => compromiso.tipo === tipo).length,
    })).filter(({ cantidad }) => cantidad > 0);
    conteo.set(fecha, { total: delDia.length, tipos });
  }
  return conteo;
}

const NOMBRE_PLURAL: Record<TipoCompromiso, [string, string]> = {
  reserva: ['reserva', 'reservas'],
  asesoria: ['asesoría', 'asesorías'],
  tablet: ['préstamo de tablet', 'préstamos de tablet'],
};

/** "1 reserva" o "2 asesorías". */
const textoTipo = (tipo: TipoCompromiso, cantidad: number) =>
  `${cantidad} ${NOMBRE_PLURAL[tipo][cantidad === 1 ? 0 : 1]}`;

/** "Sin compromisos", "1 reserva" o "3 compromisos: 1 reserva y 2 asesorías" (lector de pantalla). */
export function textoConteoTipos(conteo: ConteoTipos | undefined): string {
  if (!conteo || conteo.total === 0) return 'Sin compromisos';
  const partes = conteo.tipos.map(({ tipo, cantidad }) => textoTipo(tipo, cantidad));
  if (partes.length === 1) return partes[0];
  const ultima = partes.pop();
  return `${conteo.total} compromisos: ${partes.join(', ')} y ${ultima}`;
}
