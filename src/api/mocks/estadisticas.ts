/**
 * DATOS DE PRUEBA de los registros de uso (HU-25 y HU-26).
 *
 * PROVISIONAL: son 38 operaciones de octubre repartidas entre servicios, tipos de usuario y
 * programas, en días hábiles, con algunos datos no informados (HU-25, CA2), para que los
 * indicadores y los filtros de HU-26 tengan qué mostrar. La captura real la hará el Backend.
 *
 * #307: las asesorías y las capacitaciones llevan una temática real (los temas y las líneas de
 * los mocks, que son los de la bibliotecóloga), y lo que se aprueba (espacios, asesorías y
 * capacitaciones), la hora de la solicitud y de la respuesta, con tiempos de ejemplo.
 */
import { NO_INFORMADO, type RegistroUso, type ServicioEstadistica } from '@/types';

import { TEMAS_ASESORIA } from './asesorias';
import { LINEAS_FORMACION } from './capacitaciones';

/** Fecha de octubre de 2026, por día. Ayuda a repartir los 38 registros. */
const dia = (n: number) => `2026-10-${String(n).padStart(2, '0')}`;

type Fila = Omit<RegistroUso, 'id' | 'facultad' | 'sede' | 'semestre'>;

/**
 * Facultad, sede y semestre de cada persona de prueba (versión 1.1, #259). Se resuelven por
 * usuario para no repetirlos en las 38 filas; quien no esté aquí queda 'no_informado'.
 */
const PERSONA: Record<string, { facultad: string; sede: string; semestre: string }> = {
  'u-estudiante': { facultad: 'Ciencias de la Salud', sede: 'Valledupar', semestre: '8' },
  'u-estudiante-2': { facultad: 'Ingenierías y Tecnologías', sede: 'Valledupar', semestre: '4' },
  'u-docente': { facultad: 'Ingenierías y Tecnologías', sede: 'Valledupar', semestre: NO_INFORMADO },
  'u-administrador': { facultad: NO_INFORMADO, sede: 'Valledupar', semestre: NO_INFORMADO },
  'u-facilitador': { facultad: NO_INFORMADO, sede: 'Valledupar', semestre: NO_INFORMADO },
  'u-egresado': { facultad: 'Ciencias Administrativas, Contables y Económicas', sede: 'Aguachica', semestre: NO_INFORMADO },
};

const dePersona = (usuarioId: string) =>
  PERSONA[usuarioId] ?? { facultad: NO_INFORMADO, sede: NO_INFORMADO, semestre: NO_INFORMADO };

const FILAS: Fila[] = [
  // Laura Pérez (estudiante, Enfermería): reservas y asesorías
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'espacios', finalidad: 'Estudio en grupo', fecha: dia(2), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-estudiante', nombre: 'Laura Pérez', tipoUsuario: 'estudiante', programa: 'Enfermería', servicio: 'asesorias', finalidad: 'Citas y referencias', fecha: dia(5), modalidad: 'presencial', estado: 'completada' , calificacion: 5 },
  { usuarioId: 'u-estudiante', nombre: 'Laura Pérez', tipoUsuario: 'estudiante', programa: 'Enfermería', servicio: 'tablets', finalidad: 'Consulta de artículos', fecha: dia(7), fechaFin: dia(7), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-estudiante', nombre: 'Laura Pérez', tipoUsuario: 'estudiante', programa: 'Enfermería', servicio: 'guias', finalidad: 'Normas APA', fecha: dia(9), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-estudiante', nombre: 'Laura Pérez', tipoUsuario: 'estudiante', programa: 'Enfermería', servicio: 'capacitaciones', finalidad: 'Búsqueda de información de impacto', fecha: dia(12), modalidad: 'presencial', estado: 'completada' , calificacion: 4 },
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'espacios', finalidad: 'Trabajo de grado', fecha: dia(15), modalidad: 'presencial', estado: 'cancelada' },

  // Carlos Ramírez (docente, Ingeniería de Sistemas)
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'espacios', finalidad: 'Comité curricular', fecha: dia(5), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'capacitaciones', finalidad: 'Bases de datos', fecha: dia(6), modalidad: 'virtual', estado: 'completada' , calificacion: 5 },
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'asesorias', finalidad: 'Revisión de anteproyecto', fecha: dia(8), modalidad: 'virtual', estado: 'completada' , calificacion: 3 },
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'tablets', finalidad: 'Prueba de app', fecha: dia(12), fechaFin: dia(12), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'catalogo', finalidad: 'Búsqueda de libros', fecha: dia(14), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'espacios', finalidad: 'Clase práctica', fecha: dia(19), modalidad: 'presencial', estado: 'pendiente' },

  // Ana Torres (administrativo, sin programa)
  { usuarioId: 'u-administrador', nombre: 'Ana Torres', tipoUsuario: 'administrativo', programa: NO_INFORMADO, servicio: 'asesorias', finalidad: 'Acompañamiento', fecha: dia(1), modalidad: 'presencial', estado: 'completada' , calificacion: 4 },
  { usuarioId: 'u-administrador', nombre: 'Ana Torres', tipoUsuario: 'administrativo', programa: NO_INFORMADO, servicio: 'espacios', finalidad: 'Reunión', fecha: dia(5), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-administrador', nombre: 'Ana Torres', tipoUsuario: 'administrativo', programa: NO_INFORMADO, servicio: 'guias', finalidad: 'Difusión', fecha: dia(12), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-administrador', nombre: 'Ana Torres', tipoUsuario: 'administrativo', programa: NO_INFORMADO, servicio: 'capacitaciones', finalidad: 'Formación docente', fecha: dia(19), modalidad: 'virtual', estado: 'completada' , calificacion: 5 },

  // Estudiantes de otros programas
  { usuarioId: 'u-estudiante-2', nombre: 'Andrés Mejía', tipoUsuario: 'estudiante', programa: 'Derecho', servicio: 'asesorias', finalidad: 'Citas legales', fecha: dia(5), modalidad: 'presencial', estado: 'completada' , calificacion: 4 },
  { usuarioId: 'u-estudiante-2', nombre: 'Andrés Mejía', tipoUsuario: 'estudiante', programa: 'Derecho', servicio: 'tablets', finalidad: 'Lectura de jurisprudencia', fecha: dia(14), fechaFin: dia(14), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-administrativo', nombre: 'Diana Ospina', tipoUsuario: 'administrativo', programa: NO_INFORMADO, servicio: 'espacios', finalidad: 'Sustentación', fecha: dia(19), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-estudiante-3', nombre: 'Valentina Ríos', tipoUsuario: 'estudiante', programa: 'Licenciatura en Educación', servicio: 'guias', finalidad: 'Normas APA', fecha: dia(2), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-estudiante-3', nombre: 'Valentina Ríos', tipoUsuario: 'estudiante', programa: 'Licenciatura en Educación', servicio: 'capacitaciones', finalidad: 'Gestores bibliográficos', fecha: dia(16), modalidad: 'virtual', estado: 'completada' , calificacion: 5 },
  { usuarioId: 'u-estudiante-3', nombre: 'Valentina Ríos', tipoUsuario: 'estudiante', programa: 'Licenciatura en Educación', servicio: 'catalogo', finalidad: 'Libros de pedagogía', fecha: dia(21), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-egresado', nombre: 'Diego Salas', tipoUsuario: 'egresado', programa: 'Contaduría', servicio: 'catalogo', finalidad: 'Normatividad', fecha: dia(7), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-egresado', nombre: 'Diego Salas', tipoUsuario: 'egresado', programa: 'Contaduría', servicio: 'asesorias', finalidad: 'Trabajo de grado', fecha: dia(20), modalidad: 'virtual', estado: 'completada' , calificacion: 3 },

  // Anónimos (sin sesión): varios datos no informados
  { usuarioId: NO_INFORMADO, nombre: NO_INFORMADO, tipoUsuario: NO_INFORMADO, programa: NO_INFORMADO, servicio: 'catalogo', finalidad: NO_INFORMADO, fecha: dia(5), modalidad: NO_INFORMADO, estado: 'completada' },
  { usuarioId: NO_INFORMADO, nombre: NO_INFORMADO, tipoUsuario: NO_INFORMADO, programa: NO_INFORMADO, servicio: 'guias', finalidad: NO_INFORMADO, fecha: dia(6), modalidad: NO_INFORMADO, estado: 'completada' },
  { usuarioId: NO_INFORMADO, nombre: NO_INFORMADO, tipoUsuario: NO_INFORMADO, programa: NO_INFORMADO, servicio: 'espacios', finalidad: NO_INFORMADO, fecha: dia(12), modalidad: NO_INFORMADO, estado: 'completada' },
  { usuarioId: NO_INFORMADO, nombre: NO_INFORMADO, tipoUsuario: NO_INFORMADO, programa: NO_INFORMADO, servicio: 'catalogo', finalidad: NO_INFORMADO, fecha: dia(19), modalidad: NO_INFORMADO, estado: 'cancelada' },
  { usuarioId: NO_INFORMADO, nombre: NO_INFORMADO, tipoUsuario: NO_INFORMADO, programa: NO_INFORMADO, servicio: 'guias', finalidad: NO_INFORMADO, fecha: dia(26), modalidad: NO_INFORMADO, estado: 'completada' },

  // Más movimiento para que los gráficos no queden planos
  { usuarioId: 'u-estudiante', nombre: 'Laura Pérez', tipoUsuario: 'estudiante', programa: 'Enfermería', servicio: 'catalogo', finalidad: 'Artículos de enfermería', fecha: dia(23), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'asesorias', finalidad: 'Proyecto de aula', fecha: dia(26), modalidad: 'presencial', estado: 'completada' , calificacion: 4 },
  { usuarioId: 'u-administrativo', nombre: 'Diana Ospina', tipoUsuario: 'administrativo', programa: NO_INFORMADO, servicio: 'espacios', finalidad: 'Estudio', fecha: dia(26), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-estudiante-2', nombre: 'Andrés Mejía', tipoUsuario: 'estudiante', programa: 'Derecho', servicio: 'guias', finalidad: 'Referencias', fecha: dia(26), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-administrador', nombre: 'Ana Torres', tipoUsuario: 'administrativo', programa: NO_INFORMADO, servicio: 'tablets', finalidad: 'Inventario', fecha: dia(27), fechaFin: dia(27), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'espacios', finalidad: 'Evaluación', fecha: dia(28), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-estudiante', nombre: 'Laura Pérez', tipoUsuario: 'estudiante', programa: 'Enfermería', servicio: 'guias', finalidad: 'Protocolos', fecha: dia(29), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-egresado', nombre: 'Diego Salas', tipoUsuario: 'egresado', programa: 'Contaduría', servicio: 'capacitaciones', finalidad: 'Actualización', fecha: dia(30), modalidad: 'virtual', estado: 'pendiente' },
];

/** Duración de los préstamos de tablet de ejemplo, en horas (#307): alrededor de 3, alguno más. */
const HORAS_TABLET = [2, 3, 3.5, 2.5];

/** Horas que tardó el personal en responder, repartidas entre los ejemplos (#307). */
const HORAS_RESPUESTA = [6, 20, 3, 30, 12, 48, 9];

const TEMAS = TEMAS_ASESORIA.map((tema) => tema.nombre);
const LINEAS = LINEAS_FORMACION.map((linea) => linea.nombre);

/** Los servicios que el personal aprueba: solo ellos tienen tiempo de respuesta. */
const SE_APRUEBAN: readonly ServicioEstadistica[] = ['espacios', 'asesorias', 'capacitaciones'];

/**
 * La temática y las horas de cada ejemplo (#307): se pidió 4 días antes a las 9:00 y se respondió
 * unas horas después; lo pendiente todavía no tiene respuesta.
 */
function calidad(
  fila: Fila,
  indice: number,
): Pick<RegistroUso, 'tematica' | 'solicitadaEl' | 'respondidaEl' | 'duracionHoras'> {
  // Tablets: cada préstamo devuelto con su duración; el del inventario, sin hora completa.
  if (fila.servicio === 'tablets') {
    const completo = fila.estado === 'completada' && fila.finalidad !== 'Inventario';
    return completo ? { duracionHoras: HORAS_TABLET[indice % HORAS_TABLET.length] } : {};
  }
  let tematica: string | undefined;
  if (fila.servicio === 'asesorias') tematica = TEMAS[indice % TEMAS.length];
  if (fila.servicio === 'capacitaciones') tematica = LINEAS[indice % LINEAS.length];
  if (!SE_APRUEBAN.includes(fila.servicio) || fila.usuarioId === NO_INFORMADO) return { tematica };
  const solicitada = new Date(`${fila.fecha}T09:00:00`);
  solicitada.setDate(solicitada.getDate() - 4);
  if (fila.estado === 'pendiente') return { tematica, solicitadaEl: solicitada.toISOString() };
  const horas = HORAS_RESPUESTA[indice % HORAS_RESPUESTA.length];
  return {
    tematica,
    solicitadaEl: solicitada.toISOString(),
    respondidaEl: new Date(solicitada.getTime() + horas * 3_600_000).toISOString(),
  };
}

/** Los registros de uso, con un id estable `uso-1`, `uso-2`… */
const registros: RegistroUso[] = FILAS.map((fila, indice) => ({
  id: `uso-${indice + 1}`,
  ...dePersona(fila.usuarioId),
  ...calidad(fila, indice),
  ...fila,
}));

/** Asistencias simuladas que se incluyen al filtrar el resumen de demostración. */
export const REGISTROS_USO: RegistroUso[] = [
  ...registros,
  {
    ...registros[1], id: 'uso-asistencia-demo-asesoria', finalidad: 'Asistencia con QR',
    calificacion: undefined, tematica: undefined, solicitadaEl: undefined, respondidaEl: undefined,
  },
  {
    ...registros[4], id: 'uso-asistencia-demo-capacitacion', finalidad: 'Asistencia manual',
    calificacion: undefined, tematica: undefined, solicitadaEl: undefined, respondidaEl: undefined,
  },
];
