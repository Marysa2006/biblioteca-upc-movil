/**
 * Estadísticas de uso: indicadores y CSV (HU-26).
 * Funciones puras, sin hooks ni API: reciben los registros y devuelven los indicadores o el
 * texto del CSV. Los datos que falten vienen ya como 'no_informado' (HU-25, CA2).
 */
import {
  NO_INFORMADO,
  type ConteoIndicador,
  type IndicadoresUso,
  type RegistroUso,
  type ServicioEstadistica,
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

/** Nombre que se muestra del tipo de usuario. */
export const NOMBRE_TIPO_USUARIO: Record<string, string> = {
  estudiante: 'Estudiante',
  docente: 'Docente',
  administrativo: 'Administrativo',
  egresado: 'Egresado',
  visitante: 'Visitante',
  [NO_INFORMADO]: 'No informado',
};

/** Nombre que se muestra del estado de la operación. */
export const NOMBRE_ESTADO_USO: Record<string, string> = {
  completada: 'Completada',
  cancelada: 'Cancelada',
  pendiente: 'Pendiente',
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

/** '2026-10' → 'octubre de 2026'. */
export function mesLegible(anioMes: string): string {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  const [anio, numero] = anioMes.split('-').map(Number);
  return `${meses[numero - 1] ?? ''} de ${anio}`;
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
 * Indicadores de uso (HU-26, CA1): total y conteos por servicio, tipo de usuario, programa y mes.
 * Sin registros, el total es 0 y las listas van vacías (CA3).
 */
export function calcularIndicadores(registros: RegistroUso[]): IndicadoresUso {
  if (registros.length === 0) {
    return { total: 0, porServicio: [], porTipoUsuario: [], porPrograma: [], porMes: [] };
  }
  return {
    total: registros.length,
    porServicio: contarPor(registros, (r) => r.servicio, NOMBRE_SERVICIO),
    porTipoUsuario: contarPor(registros, (r) => r.tipoUsuario, NOMBRE_TIPO_USUARIO),
    porPrograma: contarPor(registros, (r) => r.programa, {}),
    porMes: contarPorMes(registros),
  };
}

/** Columnas del CSV, en el orden en que se exportan. */
const COLUMNAS: { titulo: string; valor: (r: RegistroUso) => string }[] = [
  { titulo: 'Fecha', valor: (r) => r.fecha },
  { titulo: 'Fecha fin', valor: (r) => r.fechaFin ?? '' },
  { titulo: 'Servicio', valor: (r) => NOMBRE_SERVICIO[r.servicio] ?? r.servicio },
  { titulo: 'Tipo de usuario', valor: (r) => nombre(r.tipoUsuario, NOMBRE_TIPO_USUARIO) },
  { titulo: 'Programa', valor: (r) => r.programa },
  { titulo: 'Nombre', valor: (r) => r.nombre },
  { titulo: 'Finalidad', valor: (r) => r.finalidad },
  { titulo: 'Modalidad', valor: (r) => r.modalidad },
  { titulo: 'Estado', valor: (r) => nombre(r.estado, NOMBRE_ESTADO_USO) },
];

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
