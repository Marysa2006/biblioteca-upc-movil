/**
 * Mi calendario (HU-30, CA1): cómo se muestran los compromisos de la persona (ícono, nombre y
 * color de cada tipo, por día y cuántos hay). Funciones puras.
 * Qué entra al calendario lo decide construirCompromisos() (src/utils/compromisos.ts, datos).
 * Los días y la semana (de lunes a sábado) son los de la agenda (src/utils/agenda.ts).
 */
import type { CategoriaServicio } from '@/types';
import type { Compromiso, TipoCompromiso } from '@/utils/compromisos';

export type { Compromiso, TipoCompromiso } from '@/utils/compromisos';

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
