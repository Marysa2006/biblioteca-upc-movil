/**
 * DATOS DE PRUEBA de los espacios reservables (HU-16, HU-17).
 *
 * La biblioteca confirmó que solo tiene DOS espacios reservables, Virtualteca y Sala de
 * Reuniones, para unas 20 personas cada uno (15 de noviembre de 2026). La capacidad es
 * orientativa: no limita la reserva, porque si hace falta se agregan sillas. La descripción, el
 * horario y la foto siguen siendo de ejemplo.
 */
import type { Espacio } from '@/types';

export const ESPACIOS: Espacio[] = [
  {
    id: 'esp-virtualteca',
    nombre: 'Virtualteca',
    descripcion:
      'Espacio con equipos para consultar la biblioteca virtual, las bases de datos y el repositorio.',
    capacidad: 20,
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
