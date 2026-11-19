/**
 * DATOS DE PRUEBA de asesorías: temas, jornadas, franjas y citas (HU-13, HU-14 y HU-15).
 *
 * PROVISIONAL: los temas son los que menciona el servicio de asesorías de la biblioteca.
 * Los facilitadores, horarios, cupos y fechas excluidas son de ejemplo y se esperan por
 * confirmar con la biblioteca (sección 2 del documento de la iteración 3).
 *
 * Las fechas son relativas a hoy (fechasDemo): las jornadas están vigentes alrededor de hoy, sus
 * franjas se generan como al guardar una jornada (generarFranjas) y las citas caen en días de su
 * jornada, las pendientes y aprobadas adelante y las realizadas, canceladas o sin atender atrás.
 */
import type { Cita, DatosSolicitante, FranjaAsesoria, Jornada, TemaAsesoria } from '@/types';
import { sumarDias } from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';
import { generarFranjas, idFranja } from '@/utils/franjas';

import { HOY, proximo } from './fechasDemo';
import { PARAMETROS } from './parametros';

/** Días de cada jornada (0 = domingo … 6 = sábado). */
const DIAS_APA = [1, 3];
const DIAS_BUSQUEDA = [5];

/** Fechas de las citas; el historial las usa también. */
export const FECHAS_CITAS = {
  'cit-1': proximo(DIAS_APA, 1),
  'cit-2': proximo(DIAS_BUSQUEDA, 1),
  'cit-3': proximo(DIAS_APA, -2),
  'cit-4': proximo(DIAS_BUSQUEDA, -1),
  'cit-5': proximo(DIAS_APA, -1),
  // Citas pendientes de la 1.1: dos para que la agenda tenga qué aprobar y rechazar.
  'cit-7': proximo(DIAS_APA, 1),
  'cit-8': proximo(DIAS_APA, 3),
  // Realizada y ya calificada (#254): para probar que no se califica dos veces.
  'cit-10': proximo(DIAS_APA, -3),
};

/** Datos del solicitante, como los copia la solicitud (#248). */
const deLaura: DatosSolicitante = {
  tipo: 'estudiante',
  nombreCompleto: 'LAURA PÉREZ',
  identificacion: '1065123456',
  correo: 'laura.perez@unicesar.edu.co',
  celular: '3001234567',
  nivel: 'pregrado',
  facultad: 'Ciencias de la Salud',
  programa: 'Enfermería',
  semestre: 8,
};
const deCarlos: DatosSolicitante = {
  tipo: 'docente',
  nombreCompleto: 'CARLOS RAMÍREZ',
  identificacion: '12564321',
  correo: 'carlos.ramirez@unicesar.edu.co',
  celular: '3109876543',
  facultad: 'Ingenierías y Tecnologías',
  programa: 'Ingeniería de Sistemas',
};
const deAndres: DatosSolicitante = {
  tipo: 'estudiante',
  nombreCompleto: 'ANDRÉS MEJÍA',
  identificacion: '1098765433',
  correo: 'andres.mejia@unicesar.edu.co',
  celular: '3015557788',
  nivel: 'pregrado',
  facultad: 'Ingenierías y Tecnologías',
  programa: 'Ingeniería Civil',
  semestre: 4,
};

/** Los cinco temas que confirmó la biblioteca (15 de noviembre de 2026). */
export const TEMAS_ASESORIA: TemaAsesoria[] = [
  {
    id: 'tema-busqueda',
    nombre: 'Búsqueda en bases de datos',
    descripcion: 'Cómo buscar en las bases de datos que suscribe la biblioteca.',
    activo: true,
  },
  {
    id: 'tema-impacto',
    nombre: 'Búsqueda de información de impacto',
    descripcion: 'Apoyo a la investigación.',
    activo: true,
  },
  {
    id: 'tema-gestores',
    nombre: 'Gestores bibliográficos',
    descripcion: 'Organiza tus fuentes y genera la bibliografía.',
    activo: true,
  },
  {
    id: 'tema-apa',
    nombre: 'Normas APA y Turnitin',
    descripcion: 'Citas, referencias y revisión del trabajo con Turnitin. Se ven juntos.',
    activo: true,
  },
  {
    id: 'tema-repositorio',
    nombre: 'Repositorio institucional',
    descripcion: 'Cómo depositar los trabajos de grado en el repositorio.',
    activo: true,
  },
];

/** Julián Mendoza (u-facilitador) atiende las dos jornadas; una tiene una fecha excluida. */
export const JORNADAS_ASESORIA: Jornada[] = [
  {
    id: 'jor-apa',
    temaId: 'tema-apa',
    facilitadorId: 'u-facilitador',
    dias: DIAS_APA,
    horaInicio: '09:00',
    horaFin: '12:00',
    duracionMinutos: 30,
    cupos: 2,
    modalidad: 'presencial',
    vigenciaDesde: sumarDias(HOY, -30),
    vigenciaHasta: sumarDias(HOY, 60),
    // Un día de jornada excluido, para probar las excepciones (HU-13).
    excepciones: [proximo(DIAS_APA, 4)],
    activa: true,
  },
  {
    id: 'jor-busqueda',
    temaId: 'tema-busqueda',
    facilitadorId: 'u-facilitador',
    dias: DIAS_BUSQUEDA,
    horaInicio: '10:00',
    horaFin: '12:00',
    duracionMinutos: 60,
    cupos: 3,
    modalidad: 'presencial',
    vigenciaDesde: sumarDias(HOY, -30),
    vigenciaHasta: sumarDias(HOY, 60),
    excepciones: [],
    activa: true,
  },
];

/**
 * Franjas de las jornadas, generadas como al guardarlas (HU-13). Los cupos ya descuentan las
 * citas pendientes y aprobadas (se calculan al final, cuando existen las citas).
 */
export const FRANJAS_ASESORIA: FranjaAsesoria[] = JORNADAS_ASESORIA.flatMap((jornada) =>
  generarFranjas(jornada, PARAMETROS),
);

export const CITAS_ASESORIA: Cita[] = [
  {
    id: 'cit-1',
    franjaId: idFranja('jor-apa', FECHAS_CITAS['cit-1'], '09:00'),
    temaId: 'tema-apa',
    tema: 'Normas APA y Turnitin',
    facilitadorId: 'u-facilitador',
    facilitador: 'Julián Mendoza',
    solicitanteId: 'u-estudiante',
    solicitante: 'Laura Pérez',
    fecha: FECHAS_CITAS['cit-1'],
    horaInicio: '09:00',
    horaFin: '09:30',
    necesidad: 'Citar un libro y un artículo en APA 7.',
    modalidad: 'presencial',
    estado: 'aprobada',
    datosSolicitante: deLaura,
    personas: 1,
    participantes: ['Laura Pérez'],
  },
  {
    id: 'cit-2',
    franjaId: idFranja('jor-busqueda', FECHAS_CITAS['cit-2'], '10:00'),
    temaId: 'tema-busqueda',
    tema: 'Búsqueda en bases de datos',
    facilitadorId: 'u-facilitador',
    facilitador: 'Julián Mendoza',
    solicitanteId: 'u-docente',
    solicitante: 'Carlos Ramírez',
    fecha: FECHAS_CITAS['cit-2'],
    horaInicio: '10:00',
    horaFin: '11:00',
    necesidad: 'Buscar artículos para el proyecto de grado.',
    modalidad: 'presencial',
    estado: 'pendiente',
    datosSolicitante: deCarlos,
    personas: 2,
    participantes: ['Carlos Ramírez', 'Laura Pérez'],
    asignatura: 'Metodología de la investigación',
  },
  {
    id: 'cit-3',
    franjaId: idFranja('jor-apa', FECHAS_CITAS['cit-3'], '09:00'),
    temaId: 'tema-apa',
    tema: 'Normas APA y Turnitin',
    facilitadorId: 'u-facilitador',
    facilitador: 'Julián Mendoza',
    solicitanteId: 'u-estudiante',
    solicitante: 'Laura Pérez',
    fecha: FECHAS_CITAS['cit-3'],
    horaInicio: '09:00',
    horaFin: '09:30',
    necesidad: 'Revisar las referencias del proyecto.',
    modalidad: 'presencial',
    estado: 'realizada',
    resultado: 'Revisamos las referencias y quedaron ajustadas.',
    asistio: true,
    datosSolicitante: deLaura,
    personas: 1,
    participantes: ['Laura Pérez'],
  },
  {
    id: 'cit-4',
    franjaId: idFranja('jor-busqueda', FECHAS_CITAS['cit-4'], '10:00'),
    temaId: 'tema-busqueda',
    tema: 'Búsqueda en bases de datos',
    facilitadorId: 'u-facilitador',
    facilitador: 'Julián Mendoza',
    solicitanteId: 'u-docente',
    solicitante: 'Carlos Ramírez',
    fecha: FECHAS_CITAS['cit-4'],
    horaInicio: '10:00',
    horaFin: '11:00',
    necesidad: 'Buscar bases de datos para la asignatura.',
    modalidad: 'presencial',
    estado: 'cancelada',
    motivo: 'Se cruzó con una clase.',
  },
  {
    // Cita pasada sin atender, para registrar la inasistencia (HU-15).
    id: 'cit-5',
    franjaId: idFranja('jor-apa', FECHAS_CITAS['cit-5'], '09:00'),
    temaId: 'tema-apa',
    tema: 'Normas APA y Turnitin',
    facilitadorId: 'u-facilitador',
    facilitador: 'Julián Mendoza',
    solicitanteId: 'u-estudiante-2',
    solicitante: 'Andrés Mejía',
    fecha: FECHAS_CITAS['cit-5'],
    horaInicio: '09:00',
    horaFin: '09:30',
    necesidad: 'Revisar las citas y referencias de un trabajo.',
    modalidad: 'presencial',
    estado: 'aprobada',
  },
  {
    // Cita de hoy, para tomar la asistencia con QR (HU-33). La fecha es la del día en que se
    // abre la app; no tiene franja en el calendario de reservas.
    id: 'cit-6',
    franjaId: 'fran-prueba-hoy',
    temaId: 'tema-apa',
    tema: 'Normas APA y Turnitin',
    facilitadorId: 'u-facilitador',
    facilitador: 'Julián Mendoza',
    solicitanteId: 'u-estudiante',
    solicitante: 'Laura Pérez',
    fecha: hoyISO(),
    horaInicio: '08:00',
    horaFin: '09:00',
    necesidad: 'Revisar la bibliografía del anteproyecto.',
    modalidad: 'presencial',
    estado: 'aprobada',
  },
  {
    // Pendiente SIN facilitador (#248): la agenda tiene qué aprobar y asignar.
    id: 'cit-7',
    temaId: 'tema-apa',
    tema: 'Normas APA y Turnitin',
    solicitanteId: 'u-administrativo',
    solicitante: 'Diana Ospina',
    fecha: FECHAS_CITAS['cit-7'],
    horaInicio: '10:30',
    horaFin: '11:30',
    necesidad: 'Aprender a citar fuentes en un informe de gestión.',
    modalidad: 'presencial',
    estado: 'pendiente',
    datosSolicitante: {
      tipo: 'administrativo',
      nombreCompleto: 'DIANA OSPINA',
      identificacion: '12547897',
      correo: 'diana.ospina@unicesar.edu.co',
      celular: '3009998877',
      facultad: 'Ciencias Administrativas, Contables y Económicas',
    },
    personas: 1,
    participantes: ['Diana Ospina'],
  },
  {
    // Pendiente VIRTUAL y sin enlace: aprueba el CA3 (una virtual no se aprueba sin enlace).
    id: 'cit-8',
    temaId: 'tema-apa',
    tema: 'Normas APA y Turnitin',
    solicitanteId: 'u-estudiante-2',
    solicitante: 'Andrés Mejía',
    fecha: FECHAS_CITAS['cit-8'],
    horaInicio: '11:00',
    horaFin: '12:00',
    necesidad: 'Revisar si las referencias del trabajo están completas.',
    modalidad: 'virtual',
    estado: 'pendiente',
    datosSolicitante: deAndres,
    personas: 1,
    participantes: ['Andrés Mejía'],
  },
  {
    // Virtual ya aprobada con enlace: lo que verá la persona en Mis citas.
    id: 'cit-9',
    temaId: 'tema-busqueda',
    tema: 'Búsqueda en bases de datos',
    facilitadorId: 'u-facilitador',
    facilitador: 'Julián Mendoza',
    solicitanteId: 'u-estudiante',
    solicitante: 'Laura Pérez',
    fecha: FECHAS_CITAS['cit-7'],
    horaInicio: '14:00',
    horaFin: '15:00',
    necesidad: 'Buscar artículos sobre lactancia materna.',
    modalidad: 'virtual',
    estado: 'aprobada',
    enlaceVirtual: 'https://meet.google.com/abc-defg-hij',
    datosSolicitante: deLaura,
    personas: 1,
    participantes: ['Laura Pérez'],
  },
  {
    // Realizada y ya calificada (#254). cit-3 es la realizada que Laura todavía puede calificar.
    id: 'cit-10',
    temaId: 'tema-apa',
    tema: 'Normas APA y Turnitin',
    facilitadorId: 'u-facilitador',
    facilitador: 'Julián Mendoza',
    solicitanteId: 'u-estudiante',
    solicitante: 'Laura Pérez',
    fecha: FECHAS_CITAS['cit-10'],
    horaInicio: '10:00',
    horaFin: '11:00',
    necesidad: 'Revisar el informe de similitud de Turnitin.',
    modalidad: 'presencial',
    estado: 'realizada',
    resultado: 'Revisamos el informe y se ajustaron las citas textuales.',
    asistio: true,
    datosSolicitante: deLaura,
    personas: 1,
    participantes: ['Laura Pérez'],
    calificacion: {
      puntaje: 5,
      comentario: 'Muy clara la explicación del informe.',
      fecha: FECHAS_CITAS['cit-10'],
    },
  },
];

// Cada cita pendiente o aprobada ocupa un cupo de su franja.
for (const cita of CITAS_ASESORIA) {
  if (cita.estado !== 'pendiente' && cita.estado !== 'aprobada') continue;
  const franja = FRANJAS_ASESORIA.find((actual) => actual.id === cita.franjaId);
  if (franja) franja.cuposLibres = Math.max(0, franja.cuposLibres - 1);
}
