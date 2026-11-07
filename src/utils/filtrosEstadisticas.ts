/**
 * Filtros e indicadores de la sección Indicadores (HU-26). Funciones puras, sin hooks: arman
 * las opciones de cada filtro con su cantidad, el resumen de lo elegido y el porcentaje de
 * cada barra. Los nombres legibles salen de src/utils/estadisticas.ts (HU-26 Datos).
 */
import {
  NO_INFORMADO,
  type ConteoIndicador,
  type FiltrosEstadisticas,
  type IndicadoresUso,
  type RegistroUso,
  type ServicioEstadistica,
} from '@/types';
import { fechaLegible } from '@/utils/fechas';
import { NOMBRE_PROGRAMA, NOMBRE_SERVICIO, NOMBRE_TIPO_USUARIO } from '@/utils/estadisticas';

/** Valor del chip "Todos" en cada filtro. */
export const TODOS = 'todos';

/** Filtros que se eligen con chips: servicio, tipo de usuario y programa. */
export type CampoFiltro = 'servicio' | 'tipoUsuario' | 'programa';

/** Una opción de un filtro; tiene la misma forma que OpcionFiltro de ChipsFiltro. */
export type OpcionFiltro<T extends string> = { valor: T; etiqueta: string; cantidad: number };

export type OpcionesFiltros = Record<CampoFiltro, OpcionFiltro<string>[]>;

const NOMBRES: Record<CampoFiltro, Record<string, string>> = {
  servicio: NOMBRE_SERVICIO,
  tipoUsuario: NOMBRE_TIPO_USUARIO,
  programa: NOMBRE_PROGRAMA,
};

/** Nombre legible de un valor de un filtro; si no se conoce, se muestra tal cual. */
export function nombreValorFiltro(campo: CampoFiltro, valor: string): string {
  return NOMBRES[campo][valor] ?? valor;
}

/**
 * Las opciones de un filtro: "Todos" y solo los valores que aparecen en los registros, de más
 * a menos usados, cada uno con su cantidad. Si el valor elegido ya no aparece (por ejemplo, al
 * cambiar el periodo), se conserva con 0 para que la persona vea qué tiene elegido.
 */
function opcionesDe(
  registros: RegistroUso[],
  campo: CampoFiltro,
  elegido: string | undefined,
): OpcionFiltro<string>[] {
  const conteo = new Map<string, number>();
  for (const registro of registros) {
    conteo.set(registro[campo], (conteo.get(registro[campo]) ?? 0) + 1);
  }
  if (elegido && elegido !== TODOS && !conteo.has(elegido)) {
    conteo.set(elegido, 0);
  }
  const opciones = [...conteo.entries()]
    .map(([valor, cantidad]) => ({ valor, etiqueta: nombreValorFiltro(campo, valor), cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad || a.etiqueta.localeCompare(b.etiqueta));
  return [{ valor: TODOS, etiqueta: 'Todos', cantidad: registros.length }, ...opciones];
}

/** Opciones de los tres filtros con chips, a partir de los registros del periodo. */
export function opcionesFiltros(
  registros: RegistroUso[],
  filtros: FiltrosEstadisticas,
): OpcionesFiltros {
  return {
    servicio: opcionesDe(registros, 'servicio', filtros.servicio),
    tipoUsuario: opcionesDe(registros, 'tipoUsuario', filtros.tipoUsuario),
    programa: opcionesDe(registros, 'programa', filtros.programa),
  };
}

/** Si hay algún filtro elegido (periodo o chips). */
export function hayFiltros(filtros: FiltrosEstadisticas): boolean {
  return Boolean(
    filtros.desde ||
    filtros.hasta ||
    (filtros.servicio && filtros.servicio !== TODOS) ||
    (filtros.tipoUsuario && filtros.tipoUsuario !== TODOS) ||
    (filtros.programa && filtros.programa !== TODOS),
  );
}

/** El periodo en palabras: "Del 1 de octubre al 20 de octubre", "Desde…", "Hasta…" o null. */
export function textoPeriodo(desde?: string, hasta?: string): string | null {
  if (desde && hasta) return `Del ${fechaLegible(desde)} al ${fechaLegible(hasta)}`;
  if (desde) return `Desde el ${fechaLegible(desde)}`;
  if (hasta) return `Hasta el ${fechaLegible(hasta)}`;
  return null;
}

/**
 * Resumen de los filtros para el bloque cerrado, por ejemplo
 * "Del 1 de octubre al 20 de octubre · Espacios · Estudiante".
 */
export function resumenFiltros(filtros: FiltrosEstadisticas): string {
  const partes: string[] = [];
  const periodo = textoPeriodo(filtros.desde, filtros.hasta);
  if (periodo) partes.push(periodo);
  for (const campo of ['servicio', 'tipoUsuario', 'programa'] as const) {
    const valor = filtros[campo];
    if (valor && valor !== TODOS) partes.push(nombreValorFiltro(campo, valor));
  }
  return partes.length > 0 ? partes.join(' · ') : 'Sin filtros: todas las operaciones';
}

/** Porcentaje entero de una parte; "menos de 1" no se redondea a 0 si hay algo. */
export function textoPorcentaje(cantidad: number, total: number): string {
  if (total <= 0 || cantidad <= 0) return '0 %';
  const valor = (cantidad / total) * 100;
  return valor < 1 ? 'menos de 1 %' : `${Math.round(valor)} %`;
}

/** "1 operación" o "12 operaciones". */
export function textoOperaciones(cantidad: number): string {
  return cantidad === 1 ? '1 operación' : `${cantidad} operaciones`;
}

/** Cuántos programas mostrar en el ranking; el resto se resume en una línea. */
export const LIMITE_PROGRAMAS = 5;

/**
 * Operaciones sin programa registrado (el programa quedó "No informado", HU-25 CA2). Es un
 * indicador de calidad de los datos, como en el tablero del equipo de Análisis.
 */
export function operacionesSinPrograma(indicadores: IndicadoresUso): number {
  const etiqueta = NOMBRE_PROGRAMA[NO_INFORMADO];
  return indicadores.porPrograma.find((grupo) => grupo.etiqueta === etiqueta)?.cantidad ?? 0;
}

/** El servicio de una etiqueta de los indicadores ("Espacios" → 'espacios'), o null. */
export function servicioDeEtiqueta(etiqueta: string): ServicioEstadistica | null {
  const encontrado = (Object.keys(NOMBRE_SERVICIO) as ServicioEstadistica[]).find(
    (servicio) => NOMBRE_SERVICIO[servicio] === etiqueta,
  );
  return encontrado ?? null;
}

/**
 * Abreviatura de un mes de los indicadores para las columnas: "octubre de 2026" → "oct".
 * Con `conAnio`, agrega los dos últimos dígitos del año ("oct 26"), para cuando hay meses de
 * años distintos.
 */
export function abreviaturaMes(etiqueta: string, conAnio = false): string {
  const [mes = '', , anio = ''] = etiqueta.split(' ');
  const corto = mes.slice(0, 3);
  return conAnio && anio ? `${corto} ${anio.slice(-2)}` : corto;
}

/** Si los meses de los indicadores son de más de un año. */
export function hayVariosAnios(meses: ConteoIndicador[]): boolean {
  return new Set(meses.map((mes) => mes.etiqueta.split(' ').at(-1))).size > 1;
}

/** "noviembre de 2026" → "Noviembre de 2026". */
export function conMayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export type VariacionMes = {
  /** Más, menos o igual que el mes anterior con datos; null si es el único mes. */
  sentido: 'sube' | 'baja' | 'igual' | null;
  texto: string;
};

/**
 * Cómo cambió el último mes con datos frente al anterior: "3 más que octubre",
 * "2 menos que octubre", "Igual que octubre" o "Primer mes con datos".
 */
export function variacionUltimoMes(meses: ConteoIndicador[]): VariacionMes {
  const ultimo = meses.at(-1);
  const anterior = meses.at(-2);
  if (!ultimo || !anterior) return { sentido: null, texto: 'Primer mes con datos' };
  const nombreAnterior = anterior.etiqueta.split(' ')[0];
  const diferencia = ultimo.cantidad - anterior.cantidad;
  if (diferencia > 0) return { sentido: 'sube', texto: `${diferencia} más que ${nombreAnterior}` };
  if (diferencia < 0) {
    return { sentido: 'baja', texto: `${-diferencia} menos que ${nombreAnterior}` };
  }
  return { sentido: 'igual', texto: `Igual que ${nombreAnterior}` };
}
