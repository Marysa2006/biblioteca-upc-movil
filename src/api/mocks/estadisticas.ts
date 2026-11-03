/**
 * DATOS DE PRUEBA de los registros de uso (HU-25 y HU-26).
 *
 * PROVISIONAL: son operaciones de octubre repartidas entre servicios, tipos de usuario y
 * programas, con algunos datos no informados (HU-25, CA2), para que los indicadores y los
 * filtros de HU-26 tengan qué mostrar. La captura real la hará el Backend.
 */
import { NO_INFORMADO, type RegistroUso } from '@/types';

/** Fecha de octubre de 2026, por día. Ayuda a repartir los 36 registros. */
const dia = (n: number) => `2026-10-${String(n).padStart(2, '0')}`;

type Fila = Omit<RegistroUso, 'id'>;

const FILAS: Fila[] = [
  // Laura Pérez (estudiante, Enfermería): reservas y asesorías
  { usuarioId: 'u-estudiante', nombre: 'Laura Pérez', tipoUsuario: 'estudiante', programa: 'Enfermería', servicio: 'espacios', finalidad: 'Estudio en grupo', fecha: dia(2), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-estudiante', nombre: 'Laura Pérez', tipoUsuario: 'estudiante', programa: 'Enfermería', servicio: 'asesorias', finalidad: 'Citas y referencias', fecha: dia(5), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-estudiante', nombre: 'Laura Pérez', tipoUsuario: 'estudiante', programa: 'Enfermería', servicio: 'tablets', finalidad: 'Consulta de artículos', fecha: dia(7), fechaFin: dia(7), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-estudiante', nombre: 'Laura Pérez', tipoUsuario: 'estudiante', programa: 'Enfermería', servicio: 'guias', finalidad: 'Normas APA', fecha: dia(9), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-estudiante', nombre: 'Laura Pérez', tipoUsuario: 'estudiante', programa: 'Enfermería', servicio: 'capacitaciones', finalidad: 'Búsqueda de información', fecha: dia(12), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-estudiante', nombre: 'Laura Pérez', tipoUsuario: 'estudiante', programa: 'Enfermería', servicio: 'espacios', finalidad: 'Trabajo de grado', fecha: dia(15), modalidad: 'presencial', estado: 'cancelada' },

  // Carlos Ramírez (docente, Ingeniería de Sistemas)
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'espacios', finalidad: 'Comité curricular', fecha: dia(3), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'capacitaciones', finalidad: 'Bases de datos', fecha: dia(6), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'asesorias', finalidad: 'Revisión de anteproyecto', fecha: dia(8), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'tablets', finalidad: 'Prueba de app', fecha: dia(10), fechaFin: dia(10), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'catalogo', finalidad: 'Búsqueda de libros', fecha: dia(14), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'espacios', finalidad: 'Clase práctica', fecha: dia(18), modalidad: 'presencial', estado: 'pendiente' },

  // Ana Torres (administrativo, sin programa)
  { usuarioId: 'u-administrador', nombre: 'Ana Torres', tipoUsuario: 'administrativo', programa: NO_INFORMADO, servicio: 'asesorias', finalidad: 'Acompañamiento', fecha: dia(1), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-administrador', nombre: 'Ana Torres', tipoUsuario: 'administrativo', programa: NO_INFORMADO, servicio: 'espacios', finalidad: 'Reunión', fecha: dia(4), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-administrador', nombre: 'Ana Torres', tipoUsuario: 'administrativo', programa: NO_INFORMADO, servicio: 'guias', finalidad: 'Difusión', fecha: dia(11), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-administrador', nombre: 'Ana Torres', tipoUsuario: 'administrativo', programa: NO_INFORMADO, servicio: 'capacitaciones', finalidad: 'Formación docente', fecha: dia(17), modalidad: 'virtual', estado: 'completada' },

  // Estudiantes de otros programas
  { usuarioId: 'u-estudiante-2', nombre: 'Andrés Mejía', tipoUsuario: 'estudiante', programa: 'Derecho', servicio: 'asesorias', finalidad: 'Citas legales', fecha: dia(5), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-estudiante-2', nombre: 'Andrés Mejía', tipoUsuario: 'estudiante', programa: 'Derecho', servicio: 'tablets', finalidad: 'Lectura de jurisprudencia', fecha: dia(13), fechaFin: dia(13), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-estudiante-2', nombre: 'Andrés Mejía', tipoUsuario: 'estudiante', programa: 'Derecho', servicio: 'espacios', finalidad: 'Sustentación', fecha: dia(19), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-estudiante-3', nombre: 'Valentina Ríos', tipoUsuario: 'estudiante', programa: 'Licenciatura en Educación', servicio: 'guias', finalidad: 'Normas APA', fecha: dia(2), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-estudiante-3', nombre: 'Valentina Ríos', tipoUsuario: 'estudiante', programa: 'Licenciatura en Educación', servicio: 'capacitaciones', finalidad: 'Mendeley', fecha: dia(16), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-estudiante-3', nombre: 'Valentina Ríos', tipoUsuario: 'estudiante', programa: 'Licenciatura en Educación', servicio: 'catalogo', finalidad: 'Libros de pedagogía', fecha: dia(21), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-egresado', nombre: 'Diego Salas', tipoUsuario: 'egresado', programa: 'Contaduría', servicio: 'catalogo', finalidad: 'Normatividad', fecha: dia(7), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-egresado', nombre: 'Diego Salas', tipoUsuario: 'egresado', programa: 'Contaduría', servicio: 'asesorias', finalidad: 'Trabajo de grado', fecha: dia(20), modalidad: 'virtual', estado: 'completada' },

  // Visitantes (sin sesión): varios datos no informados
  { usuarioId: NO_INFORMADO, nombre: NO_INFORMADO, tipoUsuario: NO_INFORMADO, programa: NO_INFORMADO, servicio: 'catalogo', finalidad: NO_INFORMADO, fecha: dia(3), modalidad: NO_INFORMADO, estado: 'completada' },
  { usuarioId: NO_INFORMADO, nombre: NO_INFORMADO, tipoUsuario: NO_INFORMADO, programa: NO_INFORMADO, servicio: 'guias', finalidad: NO_INFORMADO, fecha: dia(6), modalidad: NO_INFORMADO, estado: 'completada' },
  { usuarioId: NO_INFORMADO, nombre: NO_INFORMADO, tipoUsuario: NO_INFORMADO, programa: NO_INFORMADO, servicio: 'espacios', finalidad: NO_INFORMADO, fecha: dia(12), modalidad: NO_INFORMADO, estado: 'completada' },
  { usuarioId: NO_INFORMADO, nombre: NO_INFORMADO, tipoUsuario: NO_INFORMADO, programa: NO_INFORMADO, servicio: 'catalogo', finalidad: NO_INFORMADO, fecha: dia(18), modalidad: NO_INFORMADO, estado: 'cancelada' },
  { usuarioId: NO_INFORMADO, nombre: NO_INFORMADO, tipoUsuario: NO_INFORMADO, programa: NO_INFORMADO, servicio: 'guias', finalidad: NO_INFORMADO, fecha: dia(24), modalidad: NO_INFORMADO, estado: 'completada' },

  // Más movimiento para que los gráficos no queden planos
  { usuarioId: 'u-estudiante', nombre: 'Laura Pérez', tipoUsuario: 'estudiante', programa: 'Enfermería', servicio: 'catalogo', finalidad: 'Artículos de enfermería', fecha: dia(23), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'asesorias', finalidad: 'Proyecto de aula', fecha: dia(24), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-estudiante-3', nombre: 'Valentina Ríos', tipoUsuario: 'estudiante', programa: 'Licenciatura en Educación', servicio: 'espacios', finalidad: 'Estudio', fecha: dia(25), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-estudiante-2', nombre: 'Andrés Mejía', tipoUsuario: 'estudiante', programa: 'Derecho', servicio: 'guias', finalidad: 'Referencias', fecha: dia(26), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-administrador', nombre: 'Ana Torres', tipoUsuario: 'administrativo', programa: NO_INFORMADO, servicio: 'tablets', finalidad: 'Inventario', fecha: dia(27), fechaFin: dia(27), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-docente', nombre: 'Carlos Ramírez', tipoUsuario: 'docente', programa: 'Ingeniería de Sistemas', servicio: 'espacios', finalidad: 'Evaluación', fecha: dia(28), modalidad: 'presencial', estado: 'completada' },
  { usuarioId: 'u-estudiante', nombre: 'Laura Pérez', tipoUsuario: 'estudiante', programa: 'Enfermería', servicio: 'guias', finalidad: 'Protocolos', fecha: dia(29), modalidad: 'virtual', estado: 'completada' },
  { usuarioId: 'u-egresado', nombre: 'Diego Salas', tipoUsuario: 'egresado', programa: 'Contaduría', servicio: 'capacitaciones', finalidad: 'Actualización', fecha: dia(30), modalidad: 'virtual', estado: 'pendiente' },
];

/** Los registros de uso, con un id estable `uso-1`, `uso-2`… */
export const REGISTROS_USO: RegistroUso[] = FILAS.map((fila, indice) => ({
  id: `uso-${indice + 1}`,
  ...fila,
}));
