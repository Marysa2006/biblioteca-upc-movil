/**
 * Estadísticas de uso: indicadores y CSV (HU-26).
 * Funciones puras, sin hooks ni API: reciben los registros y devuelven los indicadores o el
 * texto del CSV. Los datos que falten vienen ya como 'no_informado' (HU-25, CA2).
 */
import { MESES } from '@/utils/fechas';
import { NOMBRE_TIPO } from '@/utils/roles';

import {
  NO_INFORMADO,
  type ConteoIndicador,
  type IndicadoresTablets,
  type IndicadoresUso,
  type RegistroUso,
  type ServicioEstadistica,
  type TiempoRespuesta,
} from '@/types';

/** Nombre que se muestra de cada servicio en los indicadores y en el CSV. */
export const NOMBRE_SERVICIO: Record<ServicioEstadistica, string> = {
  espacios: 'Espacios',
  asesorias: 'Asesorías',
  tablets: 'Tablets',
  capacitaciones: 'Capacitaciones',
  guias: 'Guías',
  catalogo: 'Catálogo',
};

/**
 * Nombre que se muestra del tipo de usuario: reutiliza NOMBRE_TIPO (HU-05). Sin sesión no hay
 * tipo, y ese uso es el de un visitante: la biblioteca lo quiere ver así en los indicadores.
 */
export const NOMBRE_TIPO_USUARIO: Record<string, string> = {
  ...NOMBRE_TIPO,
  [NO_INFORMADO]: 'Visitante (sin sesión)',
};

/** Nombre que se muestra del estado de la operación. */
export const NOMBRE_ESTADO_USO: Record<string, string> = {
  completada: 'Finalizada',
  cancelada: 'Cancelada',
  pendiente: 'Pendiente',
};

/** Nombre legible del programa (o de cualquier texto que falte). */
export const NOMBRE_PROGRAMA: Record<string, string> = {
  [NO_INFORMADO]: 'No informado',
};

/** Nombre legible de la modalidad. */
export const NOMBRE_MODALIDAD_USO: Record<string, string> = {
  presencial: 'Presencial',
  virtual: 'Virtual',
  [NO_INFORMADO]: 'No informado',
};

/** Nombre legible de un valor de un indicador; si no se conoce, se muestra tal cual. */
const nombre = (valor: string, tabla: Record<string, string>) => tabla[valor] ?? valor;

/**
 * Cuenta los registros por un campo y devuelve los grupos de mayor a menor.
 * Los empates se ordenan por etiqueta para que el resultado sea estable.
 */
function contarPor(
  registros: RegistroUso[],
  valor: (registro: RegistroUso) => string,
  tabla: Record<string, string>,
): ConteoIndicador[] {
  const conteo = new Map<string, number>();
  for (const registro of registros) {
    const clave = valor(registro);
    conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
  }
  return [...conteo.entries()]
    .map(([clave, cantidad]) => ({ etiqueta: nombre(clave, tabla), cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad || a.etiqueta.localeCompare(b.etiqueta));
}

/** El mes 'AAAA-MM' de una fecha 'AAAA-MM-DD'. */
const mes = (fecha: string) => fecha.slice(0, 7);

/**
 * El periodo de una fecha, como el `by_semester` del Backend (#278): `AAAA-1` de enero a junio y
 * `AAAA-2` de julio a diciembre. No es el semestre del estudiante: eso es un dato de su perfil.
 */
export function periodoDe(fecha: string): string {
  const [anio, numeroMes] = fecha.split('-');
  return Number(numeroMes) <= 6 ? `${anio}-1` : `${anio}-2`;
}

/** '2026-10' → 'octubre de 2026'. */
export function mesLegible(anioMes: string): string {
  const [anio, numero] = anioMes.split('-').map(Number);
  return `${MESES[numero - 1] ?? ''} de ${anio}`;
}

/** Cuenta por mes y devuelve las etiquetas legibles, de enero a diciembre. */
function contarPorMes(registros: RegistroUso[]): ConteoIndicador[] {
  const conteo = new Map<string, number>();
  for (const registro of registros) {
    const clave = mes(registro.fecha);
    conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
  }
  // Se ordena por 'AAAA-MM', no por la etiqueta: "noviembre" iría antes que "octubre".
  return [...conteo.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([clave, cantidad]) => ({ etiqueta: mesLegible(clave), cantidad }));
}

/**
 * La duración de un préstamo de tablet cuando no llegan los parámetros: la de los mocks y la que
 * dio la bibliotecóloga (3 horas; el máximo es 4). Ver `Parametros.horasPrestamoTablet`.
 */
export const HORAS_REFERENCIA_TABLET = 3;

export type OpcionesIndicadores = {
  /** Duración de referencia de un préstamo de tablet, de los parámetros (#307). */
  horasReferenciaTablet?: number;
};

/**
 * Indicadores de uso (HU-26, CA1): total y conteos por servicio, tipo de usuario, programa y mes.
 * Sin registros, el total es 0 y las listas van vacías (CA3).
 */
export function calcularIndicadores(
  registros: RegistroUso[],
  { horasReferenciaTablet = HORAS_REFERENCIA_TABLET }: OpcionesIndicadores = {},
): IndicadoresUso {
  if (registros.length === 0) {
    return {
      total: 0,
      porServicio: [],
      porTipoUsuario: [],
      porPrograma: [],
      porMes: [],
      porFacultad: [],
      porSede: [],
      porSemestre: [],
      porPeriodo: [],
      porEstado: [],
      porModalidad: [],
      porTemaAsesoria: [],
      porLineaFormacion: [],
      tiempoRespuesta: [],
      tablets: indicadoresTablets([], horasReferenciaTablet),
    };
  }
  const asistencias = registros.filter((registro) =>
    registro.id.startsWith('uso-asistencia-') || registro.id.startsWith('uso-asi-manual-'),
  );
  const calificadas = registros.filter((r) => r.calificacion != null);
  const porPeriodo = contarPor(registros, (r) => periodoDe(r.fecha), NOMBRE_PROGRAMA);
  return {
    total: registros.length,
    asistentes: asistencias.length,
    asistentesPorServicio: contarPor(asistencias, (r) => r.servicio, NOMBRE_SERVICIO),
    porServicio: contarPor(registros, (r) => r.servicio, NOMBRE_SERVICIO),
    porTipoUsuario: contarPor(registros, (r) => r.tipoUsuario, NOMBRE_TIPO_USUARIO),
    porPrograma: contarPor(registros, (r) => r.programa, NOMBRE_PROGRAMA),
    porMes: contarPorMes(registros),
    porFacultad: contarPor(registros, (r) => r.facultad, NOMBRE_PROGRAMA),
    porSede: contarPor(registros, (r) => r.sede, NOMBRE_PROGRAMA),
    // #278: el cruce de tiempo es el periodo; `porSemestre` se queda con el mismo contenido para
    // no romper a quien ya lo lee (ronda @deprecated en el tipo).
    porSemestre: porPeriodo,
    porPeriodo,
    calificacionPromedio:
      calificadas.length === 0
        ? undefined
        : calificadas.reduce((suma, r) => suma + (r.calificacion ?? 0), 0) / calificadas.length,
    // #307: lo que pidió la bibliotecóloga en la tabla 2.7.
    porEstado: contarPor(registros, (r) => r.estado, NOMBRE_ESTADO_USO),
    porModalidad: contarPor(registros, (r) => r.modalidad, NOMBRE_MODALIDAD_USO),
    porTemaAsesoria: contarTematica(registros, 'asesorias'),
    porLineaFormacion: contarTematica(registros, 'capacitaciones'),
    tiempoRespuesta: tiemposDeRespuesta(registros),
    tablets: indicadoresTablets(registros, horasReferenciaTablet),
  };
}

/**
 * La pestaña Tablets (#307), como el tablero de Análisis de datos: los préstamos, su duración
 * promedio, cuántos duraron la referencia o menos y cuántos se devolvieron sin las dos horas.
 */
function indicadoresTablets(registros: RegistroUso[], horasReferencia: number): IndicadoresTablets {
  const prestamos = registros.filter((r) => r.servicio === 'tablets');
  const duraciones = prestamos
    .map((r) => r.duracionHoras)
    .filter((horas): horas is number => horas != null);
  const promedio =
    duraciones.length === 0
      ? undefined
      : duraciones.reduce((suma, h) => suma + h, 0) / duraciones.length;
  return {
    prestamos: prestamos.length,
    conDuracion: duraciones.length,
    duracionPromedio: promedio == null ? undefined : Math.round(promedio * 10) / 10,
    horasReferencia,
    dentroDeReferencia: duraciones.filter((h) => h <= horasReferencia).length,
    sinHoraCompleta: prestamos.filter((r) => r.estado === 'completada' && r.duracionHoras == null)
      .length,
    porMes: contarPorMes(prestamos),
    porPrograma: contarPor(prestamos, (r) => r.programa, NOMBRE_PROGRAMA),
  };
}

/**
 * Horas entre dos registros 'AAAA-MM-DD HH:MM' (la entrega y la devolución de una tablet), o
 * null si falta alguno o el orden no tiene sentido (#307).
 */
export function horasEntreFechasHoras(desde?: string, hasta?: string): number | null {
  if (!desde || !hasta) return null;
  return horasEntre(desde.replace(' ', 'T'), hasta.replace(' ', 'T'));
}

/** Usos por temática de un servicio (#307): solo los registros de ese servicio que la tienen. */
function contarTematica(
  registros: RegistroUso[],
  servicio: ServicioEstadistica,
): ConteoIndicador[] {
  return contarPor(
    registros.filter((r) => r.servicio === servicio && r.tematica),
    (r) => r.tematica ?? NO_INFORMADO,
    NOMBRE_PROGRAMA,
  );
}

/**
 * Horas entre dos instantes ISO 8601 (#307), o null si falta alguno o el orden no tiene sentido.
 */
export function horasEntre(desde?: string, hasta?: string): number | null {
  if (!desde || !hasta) return null;
  const milisegundos = Date.parse(hasta) - Date.parse(desde);
  if (!Number.isFinite(milisegundos) || milisegundos < 0) return null;
  return milisegundos / 3_600_000;
}

/**
 * Tiempo promedio de respuesta del personal por servicio (#307): de la solicitud a la primera
 * respuesta. Solo cuentan los registros que tienen las dos horas; en el orden de NOMBRE_SERVICIO.
 */
function tiemposDeRespuesta(registros: RegistroUso[]): TiempoRespuesta[] {
  const horasPorServicio = new Map<ServicioEstadistica, number[]>();
  for (const registro of registros) {
    const horas = horasEntre(registro.solicitadaEl, registro.respondidaEl);
    if (horas == null) continue;
    horasPorServicio.set(registro.servicio, [
      ...(horasPorServicio.get(registro.servicio) ?? []),
      horas,
    ]);
  }
  return (Object.keys(NOMBRE_SERVICIO) as ServicioEstadistica[])
    .filter((servicio) => horasPorServicio.has(servicio))
    .map((servicio) => {
      const horas = horasPorServicio.get(servicio) ?? [];
      const promedio = horas.reduce((suma, h) => suma + h, 0) / horas.length;
      return {
        servicio,
        etiqueta: NOMBRE_SERVICIO[servicio],
        horasPromedio: Math.round(promedio * 10) / 10,
        cantidad: horas.length,
      };
    });
}

/** Columnas del CSV, en el orden en que se exportan. */
const COLUMNAS: { titulo: string; valor: (r: RegistroUso) => string }[] = [
  { titulo: 'Fecha', valor: (r) => r.fecha },
  { titulo: 'Fecha fin', valor: (r) => r.fechaFin ?? '' },
  { titulo: 'Servicio', valor: (r) => NOMBRE_SERVICIO[r.servicio] ?? r.servicio },
  { titulo: 'Tipo de usuario', valor: (r) => nombre(r.tipoUsuario, NOMBRE_TIPO_USUARIO) },
  { titulo: 'Programa', valor: (r) => nombre(r.programa, NOMBRE_PROGRAMA) },
  // Versión 1.1 (#259): los cruces que pidió la bibliotecóloga.
  { titulo: 'Facultad', valor: (r) => nombre(r.facultad, NOMBRE_PROGRAMA) },
  { titulo: 'Sede', valor: (r) => nombre(r.sede, NOMBRE_PROGRAMA) },
  // #278: el «Periodo» es el del Backend (AAAA-1 / AAAA-2); el semestre del estudiante es suyo.
  { titulo: 'Periodo', valor: (r) => periodoDe(r.fecha) },
  { titulo: 'Semestre del estudiante', valor: (r) => nombre(r.semestre, NOMBRE_PROGRAMA) },
  { titulo: 'Calificación', valor: (r) => (r.calificacion == null ? '' : String(r.calificacion)) },
  { titulo: 'Nombre', valor: (r) => (r.nombre === NO_INFORMADO ? 'No informado' : r.nombre) },
  { titulo: 'Finalidad', valor: (r) => (r.finalidad === NO_INFORMADO ? 'No informado' : r.finalidad) },
  { titulo: 'Modalidad', valor: (r) => nombre(r.modalidad, NOMBRE_MODALIDAD_USO) },
  { titulo: 'Estado', valor: (r) => nombre(r.estado, NOMBRE_ESTADO_USO) },
  // #307: la calidad en tiempos y temáticas. Al final, para no mover las columnas de antes.
  { titulo: 'Temática', valor: (r) => r.tematica ?? '' },
  {
    titulo: 'Tiempo de respuesta (h)',
    valor: (r) => horasParaCsv(horasEntre(r.solicitadaEl, r.respondidaEl)),
  },
  { titulo: 'Duración del préstamo (h)', valor: (r) => horasParaCsv(r.duracionHoras ?? null) },
];

/** Horas con un decimal y coma, como las lee Excel en español; vacío si no hay dato (#307). */
function horasParaCsv(horas: number | null): string {
  return horas == null ? '' : String(Math.round(horas * 10) / 10).replace('.', ',');
}

/**
 * Escapa un valor para el CSV: entre comillas si trae `;`, comillas o saltos de línea, y
 * duplica las comillas. Así Excel no parte una celda en dos.
 */
function celda(valor: string): string {
  const texto = valor ?? '';
  if (/[;"\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

/** BOM UTF-8: sin él, Excel en Windows muestra mal las tildes (HU-26, CA2). */
export const BOM_UTF8 = '\uFEFF';

/** Separador del CSV: punto y coma, que es lo que espera Excel en español. */
export const SEPARADOR_CSV = ';';

/**
 * Arma el CSV de los registros (HU-26, CA2): encabezado, una fila por registro, separador `;`
 * y UTF-8 con BOM para que Excel muestre bien las tildes. Sin registros, solo el encabezado.
 */
export function registrosACsv(registros: RegistroUso[]): string {
  const lineas = [COLUMNAS.map((c) => celda(c.titulo)).join(SEPARADOR_CSV)];
  for (const registro of registros) {
    lineas.push(COLUMNAS.map((c) => celda(c.valor(registro))).join(SEPARADOR_CSV));
  }
  // Las líneas del CSV van con \r\n: es lo que entienden Excel y LibreOffice.
  return BOM_UTF8 + lineas.join('\r\n');
}

/** Nombre del archivo, con la fecha del día: `estadisticas-2026-10-30.csv`. */
export function nombreArchivoCsv(hoy: string): string {
  return `estadisticas-${hoy}.csv`;
}

export function indicadoresDeFinalizacion({ total, porEstado }: IndicadoresUso) {
  // StatisticsPage (web): suma las etiquetas Finalizada o Cancelada/Rechazada
  // respectivamente y redondea 100 × suma / total.
  const suma = (patron: RegExp) => porEstado.reduce((n, fila) =>
    patron.test(fila.etiqueta) ? n + fila.cantidad : n, 0);
  const porcentaje = (conteo: number) => total > 0 ? Math.round(100 * conteo / total) : 0;
  const finalizadas = suma(/finalizad/i);
  const noPrestadas = suma(/cancelad|rechazad/i);
  return {
    finalizadas,
    noPrestadas,
    tasaFinalizacion: porcentaje(finalizadas),
    tasaCancelacionesYRechazos: porcentaje(noPrestadas),
  };
}

export function agregarIndicadoresAlCsv(csv: string, datos: IndicadoresUso, separador: string): string {
  const { tasaFinalizacion, tasaCancelacionesYRechazos, finalizadas, noPrestadas } =
    indicadoresDeFinalizacion(datos);
  const filas = [
    ['Indicador', 'Cantidad', 'Porcentaje'],
    ['Tasa de finalización', String(finalizadas), String(tasaFinalizacion) + '%'],
    ['Cancelaciones y rechazos', String(noPrestadas), String(tasaCancelacionesYRechazos) + '%'],
    [],
    ['Asistentes por servicio', 'Cantidad'],
    ...(datos.asistentesPorServicio ?? []).map(({ etiqueta, cantidad }) => [etiqueta, String(cantidad)]),
  ];
  // Las etiquetas del servidor son texto, incluso si empiezan por un signo de fórmula.
  const escapar = (valor: string) => '"' + (/^[=+\-@\t\r]/.test(valor) ? "'" : '') + valor.replace(/"/g, '""') + '"';
  return csv.trimEnd() + '\r\n\r\n' + filas.map((fila) => fila.map(escapar).join(separador)).join('\r\n');
}
