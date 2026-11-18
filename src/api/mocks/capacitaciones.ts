/**
 * DATOS DE PRUEBA de las capacitaciones (HU-09, HU-10 y HU-12).
 *
 * Las líneas de formación son las que confirmó la biblioteca (15 de noviembre de 2026); las
 * fechas, los grupos y los participantes son de ejemplo.
 *
 * `lin-apa` tiene solicitudes activas, para la advertencia al desactivar de HU-09 (CA3). Para
 * probar una línea inactiva, se desactiva una desde Gestión → Portal.
 */
import type { DatosSolicitante, LineaFormacion, SolicitudCapacitacion } from '@/types';
import { sumarDias } from '@/utils/calendario';
import { fechaLegible } from '@/utils/fechas';

import { conHora, habil, HOY } from './fechasDemo';

/**
 * Fechas de las solicitudes, relativas a hoy (fechasDemo): las que siguen en curso, en los
 * próximos días hábiles (después de la anticipación mínima); la realizada, en el pasado.
 * El historial las usa también.
 */
export const FECHAS_CAPACITACIONES = {
  'cap-1': habil(3),
  'cap-2': habil(4),
  'cap-3': habil(5),
  'cap-3-propuesta': habil(6),
  'cap-4': habil(8),
  'cap-5': habil(-10),
};

/** Cuándo se envió cada solicitud: días antes de hoy. */
const enviada = (dias: number, hora: string) => conHora(sumarDias(HOY, -dias), hora);

const MOTIVO_CAP_3 = `El facilitador no puede el ${fechaLegible(FECHAS_CAPACITACIONES['cap-3'])}; se propone el ${fechaLegible(FECHAS_CAPACITACIONES['cap-3-propuesta'])} a la misma hora.`;

/** El motivo de la nueva fecha de cap-3; el historial lo repite. */
export const MOTIVOS_CAPACITACIONES = { 'cap-3': MOTIVO_CAP_3 };

/** Las cuatro líneas que confirmó la biblioteca (15 de noviembre de 2026), para grupos de 20 a 25. */
export const LINEAS_FORMACION: LineaFormacion[] = [
  {
    id: 'lin-apa',
    nombre: 'Normas APA',
    descripcion: 'Capacitación grupal, de 20 a 25 personas.',
    activa: true,
  },
  {
    id: 'lin-busqueda',
    nombre: 'Búsqueda de información de impacto',
    descripcion: 'Apoyo a la investigación; grupal, de 20 a 25 personas.',
    activa: true,
  },
  {
    id: 'lin-gestores',
    nombre: 'Gestores bibliográficos',
    descripcion: 'Capacitación grupal, de 20 a 25 personas.',
    activa: true,
  },
  {
    id: 'lin-repositorio',
    nombre: 'Repositorio institucional',
    descripcion: 'Pasos para depositar los trabajos; grupal, de 20 a 25 personas.',
    activa: true,
  },
];

/**
 * Solicitudes de Laura (u-estudiante) y Carlos (u-docente), una por cada estado, para probar
 * la bandeja de HU-12, «Mis solicitudes» (HU-08) y la respuesta a la nueva fecha (CA4).
 */
/**
 * Datos del solicitante copiados en la solicitud (versión 1.1, #224). Las solicitudes viejas
 * no los tienen y siguen funcionando.
 */
const DATOS_LAURA: DatosSolicitante = {
  tipo: 'estudiante',
  nombreCompleto: 'Laura Pérez',
  identificacion: '1065123456',
  correo: 'laura.perez@unicesar.edu.co',
  celular: '3001234567',
  nivel: 'pregrado',
  facultad: 'Ciencias de la Salud',
  programa: 'Enfermería',
  semestre: 8,
};

const DATOS_CARLOS: DatosSolicitante = {
  tipo: 'docente',
  nombreCompleto: 'Carlos Ramírez',
  identificacion: '12564321',
  correo: 'carlos.ramirez@unicesar.edu.co',
  celular: '3109876543',
  facultad: 'Ingenierías y Tecnologías',
  programa: 'Ingeniería de Sistemas',
};

export const SOLICITUDES_CAPACITACION: SolicitudCapacitacion[] = [
  {
    id: 'cap-1',
    lineaId: 'lin-apa',
    linea: 'Normas APA',
    solicitante: {
      id: 'u-estudiante',
      nombre: 'Laura Pérez',
      tipo: 'estudiante',
      programa: 'Enfermería',
    },
    modalidad: 'presencial',
    fecha: FECHAS_CAPACITACIONES['cap-1'],
    hora: '10:00',
    objetivo: 'Aprender a citar y referenciar el trabajo de grado.',
    grupo: 'Enfermería · octavo semestre',
    participantes: 25,
    estado: 'pendiente',
    creada: enviada(7, '09:12'),
    datosSolicitante: DATOS_LAURA,
    terminosAceptados: true,
    asignatura: 'Seminario de investigación',
    novedades: 'Algunos estudiantes no tienen portátil.',
  },
  {
    id: 'cap-2',
    lineaId: 'lin-busqueda',
    linea: 'Búsqueda de información de impacto',
    solicitante: {
      id: 'u-docente',
      nombre: 'Carlos Ramírez',
      tipo: 'docente',
      programa: 'Ingeniería de Sistemas',
    },
    modalidad: 'virtual',
    fecha: FECHAS_CAPACITACIONES['cap-2'],
    hora: '14:00',
    objetivo: 'Capacitar al grupo en el uso de bases de datos para el proyecto integrador.',
    grupo: 'Ingeniería de Sistemas · Proyecto integrador',
    participantes: 30,
    estado: 'aprobada',
    responsableId: 'u-facilitador',
    responsable: 'Julián Mendoza',
    creada: enviada(7, '10:05'),
    datosSolicitante: DATOS_CARLOS,
    terminosAceptados: true,
    asignatura: 'Proyecto integrador',
  },
  {
    id: 'cap-3',
    lineaId: 'lin-apa',
    linea: 'Normas APA',
    solicitante: {
      id: 'u-estudiante',
      nombre: 'Laura Pérez',
      tipo: 'estudiante',
      programa: 'Enfermería',
    },
    modalidad: 'presencial',
    fecha: FECHAS_CAPACITACIONES['cap-3'],
    hora: '09:00',
    objetivo: 'Repasar el formato de las referencias antes de la entrega.',
    grupo: 'Enfermería · semillero',
    participantes: 12,
    estado: 'nueva_fecha',
    fechaPropuesta: FECHAS_CAPACITACIONES['cap-3-propuesta'],
    horaPropuesta: '09:00',
    responsableId: 'u-facilitador',
    responsable: 'Julián Mendoza',
    motivo: MOTIVO_CAP_3,
    creada: enviada(6, '08:20'),
    datosSolicitante: DATOS_LAURA,
    terminosAceptados: true,
    // Un nombre por participante (12).
    nombresParticipantes: [
      'Laura Pérez',
      'Andrés Mejía',
      'Valentina Ríos',
      'Camilo Ortega',
      'Daniela Suárez',
      'Jhonatan Peña',
      'María José Cuello',
      'Sebastián Daza',
      'Natalia Fuentes',
      'Kevin Ochoa',
      'Luisa Fernanda Arias',
      'Óscar Maestre',
    ],
  },
  {
    id: 'cap-4',
    lineaId: 'lin-gestores',
    linea: 'Gestores bibliográficos',
    solicitante: {
      id: 'u-docente',
      nombre: 'Carlos Ramírez',
      tipo: 'docente',
      programa: 'Ingeniería de Sistemas',
    },
    modalidad: 'virtual',
    fecha: FECHAS_CAPACITACIONES['cap-4'],
    hora: '16:00',
    objetivo: 'Que los estudiantes organicen las fuentes del anteproyecto.',
    grupo: 'Ingeniería de Sistemas · metodología',
    participantes: 40,
    estado: 'rechazada',
    motivo: 'No hay facilitador disponible esa semana.',
    creada: enviada(8, '11:40'),
  },
  {
    id: 'cap-5',
    lineaId: 'lin-busqueda',
    linea: 'Búsqueda de información de impacto',
    solicitante: {
      id: 'u-estudiante',
      nombre: 'Laura Pérez',
      tipo: 'estudiante',
      programa: 'Enfermería',
    },
    modalidad: 'presencial',
    fecha: FECHAS_CAPACITACIONES['cap-5'],
    hora: '10:00',
    objetivo: 'Aprender a buscar artículos para la práctica.',
    grupo: 'Enfermería · investigación',
    participantes: 18,
    estado: 'realizada',
    responsableId: 'u-facilitador',
    responsable: 'Julián Mendoza',
    resultado: 'Se trabajó el catálogo y dos bases de datos. El grupo quedó con la guía.',
    creada: enviada(19, '15:30'),
  },
];
