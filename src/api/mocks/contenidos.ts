/**
 * DATOS DE PRUEBA de los contenidos del portal (HU-04).
 * Mezcla servicios, contenidos informativos y avisos, publicados y ocultos,
 * para probar el listado, la publicación y el orden.
 */
import type { Contenido } from '@/types';

export const CONTENIDOS: Contenido[] = [
  {
    id: 'con-servicios',
    tipo: 'servicio',
    titulo: 'Servicios de la biblioteca',
    descripcion: 'Tarjeta que presenta el listado de servicios en el portal.',
    publicado: true,
    orden: 1,
  },
  {
    id: 'con-asesorias',
    tipo: 'servicio',
    titulo: 'Asesorías especializadas',
    descripcion: 'Descripción y horario del servicio de asesorías.',
    publicado: true,
    orden: 2,
  },
  {
    id: 'con-horarios',
    tipo: 'informativo',
    titulo: 'Horarios de atención',
    descripcion: 'Horario general de la biblioteca durante el semestre.',
    publicado: true,
    orden: 3,
  },
  {
    id: 'con-aviso-matricula',
    tipo: 'aviso',
    titulo: 'Cierre por matrícula',
    descripcion: 'La biblioteca no prestará servicio durante la semana de matrícula.',
    publicado: true,
    orden: 4,
    fechaInicio: '2026-10-13',
    fechaFin: '2026-10-17',
  },
  {
    id: 'con-aviso-talleres',
    tipo: 'aviso',
    titulo: 'Talleres de Mendeley',
    descripcion: 'Inscripciones abiertas para los talleres del mes.',
    publicado: false,
    orden: 5,
  },
  {
    id: 'con-borrador',
    tipo: 'informativo',
    titulo: 'Cineclub (borrador)',
    descripcion: 'Programación por confirmar.',
    publicado: false,
    orden: 6,
  },
];
