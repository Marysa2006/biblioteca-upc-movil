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
import {
  NOMBRE_PROGRAMA,
  NOMBRE_SERVICIO,
  NOMBRE_TIPO_USUARIO,
  periodoDe,
} from '@/utils/estadisticas';

/** Valor del chip "Todos" en cada filtro. */
export const TODOS = 'todos';

/**
 * Filtros que se eligen con chips: servicio, tipo de usuario y programa, y desde la versión 1.1
 * (#260) facultad, sede y periodo (`AAAA-1` / `AAAA-2`, el "semestre" del Backend).
 */
export type CampoFiltro = 'servicio' | 'tipoUsuario' | 'programa' | 'facultad' | 'sede' | 'periodo';

/** Los campos con chips, en el orden en que se muestran. */
export const CAMPOS_FILTRO: readonly CampoFiltro[] = [
  'servicio',
  'tipoUsuario',
  'programa',
  'facultad',
  'sede',
  'periodo',
];

/** El valor de un registro para cada filtro; el periodo sale de la fecha (#278). */
const VALOR_DE: Record<CampoFiltro, (registro: RegistroUso) => string> = {
  servicio: (r) => r.servicio,
  tipoUsuario: (r) => r.tipoUsuario,
  programa: (r) => r.programa,
  facultad: (r) => r.facultad,
  sede: (r) => r.sede,
  periodo: (r) => periodoDe(r.fecha),
};

/** Una opción de un filtro; tiene la misma forma que OpcionFiltro de ChipsFiltro. */
export type OpcionFiltro<T extends string> = { valor: T; etiqueta: string; cantidad: number };

export type OpcionesFiltros = Record<CampoFiltro, OpcionFiltro<string>[]>;

const NOMBRES: Record<CampoFiltro, Record<string, string>> = {
  servicio: NOMBRE_SERVICIO,
  tipoUsuario: NOMBRE_TIPO_USUARIO,
  programa: NOMBRE_PROGRAMA,
  // NOMBRE_PROGRAMA solo nombra "No informado": sirve igual para facultad y sede.
  facultad: NOMBRE_PROGRAMA,
  sede: NOMBRE_PROGRAMA,
  periodo: {},
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
    const valor = VALOR_DE[campo](registro);
    conteo.set(valor, (conteo.get(valor) ?? 0) + 1);
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
    facultad: opcionesDe(registros, 'facultad', filtros.facultad),
    sede: opcionesDe(registros, 'sede', filtros.sede),
    periodo: opcionesDe(registros, 'periodo', filtros.periodo),
  };
}

/** Si hay algún filtro elegido (periodo o chips). */
export function hayFiltros(filtros: FiltrosEstadisticas): boolean {
  return Boolean(
    filtros.desde ||
      filtros.hasta ||
      CAMPOS_FILTRO.some((campo) => filtros[campo] && filtros[campo] !== TODOS),
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
  for (const campo of CAMPOS_FILTRO) {
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

/** 4.25 → "4,3 de 5": la calificación promedio con una cifra decimal y coma (#260). */
export function textoCalificacion(promedio: number): string {
  return `${promedio.toFixed(1).replace('.', ',')} de 5`;
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

/** 1,5 → "1,5"; 18,0 → "18": un decimal con coma, sin ",0". */
const conUnDecimal = (valor: number) => (Math.round(valor * 10) / 10).toString().replace('.', ',');

/**
 * El tiempo de respuesta para leer (#307): «menos de 1 h», «17,6 h» o, desde dos días, «2,5 días».
 */
export function textoHoras(horas: number): string {
  if (horas < 1) return 'menos de 1 h';
  if (horas < 48) return `${conUnDecimal(horas)} h`;
  return `${conUnDecimal(horas / 24)} días`;
}

/** Los periodos académicos (`AAAA-1`, `AAAA-2`) en orden de tiempo, para las columnas (#307). */
export function periodosEnOrden(periodos: ConteoIndicador[]): ConteoIndicador[] {
  return [...periodos].sort((a, b) => a.etiqueta.localeCompare(b.etiqueta));
}

/** "2026-2" → "Periodo 2026-2, de julio a diciembre", para el lector de pantalla (#307). */
export function nombrePeriodo(etiqueta: string): string {
  const [, mitad] = etiqueta.split('-');
  if (mitad === '1') return `Periodo ${etiqueta}, de enero a junio`;
  if (mitad === '2') return `Periodo ${etiqueta}, de julio a diciembre`;
  return conMayuscula(etiqueta);
}

/**
 * Hasta tres frases con lo más llamativo de los indicadores, como «Hallazgos clave» del tablero
 * de Análisis de datos (#307): qué servicio domina, cuántas operaciones no tienen programa, qué
 * servicio tarda más en responderse y cuántos préstamos de tablet cumplen la duración. Solo las
 * que tienen datos.
 */
export function hallazgosClave(indicadores: IndicadoresUso): string[] {
  const { total, tablets } = indicadores;
  const frases: string[] = [];
  const servicio = indicadores.porServicio[0];
  if (servicio) {
    frases.push(
      `${textoPorcentaje(servicio.cantidad, total)} de las operaciones fueron de ${servicio.etiqueta.toLowerCase()}.`,
    );
  }
  const sinPrograma = operacionesSinPrograma(indicadores);
  if (sinPrograma > 0) {
    frases.push(
      `${textoPorcentaje(sinPrograma, total)} de las operaciones no tienen programa registrado.`,
    );
  }
  const masLento = [...indicadores.tiempoRespuesta].sort(
    (a, b) => b.horasPromedio - a.horasPromedio,
  )[0];
  if (masLento && indicadores.tiempoRespuesta.length > 1) {
    frases.push(
      `${masLento.etiqueta} es el servicio que más tarda en responderse: ${textoHoras(masLento.horasPromedio)} en promedio.`,
    );
  }
  if (tablets.conDuracion > 0) {
    frases.push(
      `${textoPorcentaje(tablets.dentroDeReferencia, tablets.conDuracion)} de los préstamos de tablet duraron ${tablets.horasReferencia} h o menos.`,
    );
  }
  return frases.slice(0, 3);
}

/** El nombre de cada filtro, para las listas desplegables y los filtros activos (#307). */
export const TITULO_FILTRO: Record<CampoFiltro, string> = {
  servicio: 'Servicio',
  tipoUsuario: 'Tipo de usuario',
  programa: 'Programa',
  facultad: 'Facultad',
  sede: 'Sede',
  periodo: 'Periodo académico',
};

/** Un filtro elegido, para mostrarlo con ✕ aunque el panel esté cerrado (#307). */
export type FiltroActivo = {
  clave: CampoFiltro | 'fechas';
  texto: string;
  /** Lo que se aplica a los filtros para quitarlo. */
  quitar: Partial<FiltrosEstadisticas>;
};

/** Los filtros elegidos, en el orden del panel: primero las fechas y después las listas. */
export function filtrosActivos(filtros: FiltrosEstadisticas): FiltroActivo[] {
  const activos: FiltroActivo[] = [];
  const periodo = textoPeriodo(filtros.desde, filtros.hasta);
  if (periodo) {
    activos.push({
      clave: 'fechas',
      texto: periodo,
      quitar: { desde: undefined, hasta: undefined },
    });
  }
  for (const campo of CAMPOS_FILTRO) {
    const valor = filtros[campo];
    if (valor && valor !== TODOS) {
      activos.push({
        clave: campo,
        texto: `${TITULO_FILTRO[campo]}: ${nombreValorFiltro(campo, valor)}`,
        quitar: { [campo]: undefined },
      });
    }
  }
  return activos;
}

/** Atajos del periodo (#307): lo más común sin abrir los dos calendarios. */
export type PeriodoRapido = 'mes' | 'semestre' | 'todo';

/**
 * Las fechas de un atajo, hasta hoy: el mes en curso, el semestre en curso (enero a junio o julio
 * a diciembre) o sin fechas.
 */
export function fechasDePeriodoRapido(
  periodo: PeriodoRapido,
  hoy: string,
): Pick<FiltrosEstadisticas, 'desde' | 'hasta'> {
  if (periodo === 'todo') return { desde: undefined, hasta: undefined };
  const [anio, mes] = hoy.split('-');
  if (periodo === 'mes') return { desde: `${anio}-${mes}-01`, hasta: hoy };
  return { desde: Number(mes) <= 6 ? `${anio}-01-01` : `${anio}-07-01`, hasta: hoy };
}

/** Qué atajo corresponde a las fechas elegidas, o null si son otras (#307). */
export function periodoRapidoDe(
  filtros: Pick<FiltrosEstadisticas, 'desde' | 'hasta'>,
  hoy: string,
): PeriodoRapido | null {
  const iguales = (periodo: PeriodoRapido) => {
    const fechas = fechasDePeriodoRapido(periodo, hoy);
    return fechas.desde === filtros.desde && fechas.hasta === filtros.hasta;
  };
  return (['todo', 'mes', 'semestre'] as const).find(iguales) ?? null;
}
