/**
 * DATOS DE PRUEBA de los espacios reservables (HU-16, HU-17).
 *
 * PROVISIONAL: la biblioteca confirmó que solo tiene DOS espacios reservables:
 * Virtualteca y Sala de Reuniones. Los nombres son reales; la descripción, la capacidad,
 * el horario y la foto son de ejemplo y se esperan por confirmar con la dirección de la
 * biblioteca. Las fotografías quedan sin definir hasta que las entreguen.
 */
import type { Espacio } from '@/types';

export const ESPACIOS: Espacio[] = [
  {
    id: 'esp-virtualteca',
    nombre: 'Virtualteca',
    descripcion:
      'Espacio con equipos para consultar la biblioteca virtual, las bases de datos y el repositorio.',
    capacidad: 15,
    horario: 'Lunes a viernes, 08:00 a 18:00',
    activo: true,
  },
  {
    id: 'esp-sala-reuniones',
    nombre: 'Sala de Reuniones',
    descripcion: 'Sala cerrada para reuniones, comités, talleres y actividades académicas.',
    capacidad: 20,
    horario: 'Lunes a viernes, 08:00 a 17:00',
    activo: true,
  },
];
