/**
 * DATOS DE PRUEBA de los espacios reservables (HU-16, HU-17).
 * Incluye un espacio inactivo para probar que no se ofrece (HU-16, CA3).
 * Las fotografías quedan sin definir hasta que la biblioteca las entregue.
 */
import type { Espacio } from '@/types';

export const ESPACIOS: Espacio[] = [
  {
    id: 'esp-biblioteca',
    nombre: 'Biblioteca',
    descripcion: 'Sala principal de lectura y estudio grupal.',
    capacidad: 40,
    horario: 'Lunes a viernes, 07:00 a 18:00',
    activo: true,
  },
  {
    id: 'esp-sala-juntas',
    nombre: 'Sala de Juntas',
    descripcion: 'Sala cerrada para reuniones y comités.',
    capacidad: 12,
    horario: 'Lunes a viernes, 08:00 a 17:00',
    activo: true,
  },
  {
    id: 'esp-hemeroteca',
    nombre: 'Hemeroteca',
    descripcion: 'Consulta de revistas y publicaciones periódicas.',
    capacidad: 8,
    horario: 'Lunes a viernes, 08:00 a 16:00',
    activo: true,
  },
  {
    id: 'esp-sala-capacitacion',
    nombre: 'Sala de capacitación',
    descripcion: 'Espacio con proyector para talleres y capacitaciones.',
    capacidad: 25,
    horario: 'Lunes a viernes, 07:00 a 18:00',
    activo: true,
  },
  {
    id: 'esp-cubiculos',
    nombre: 'Cubículos de estudio',
    descripcion: 'Cubículos individuales para estudio en silencio.',
    capacidad: 4,
    horario: 'Lunes a viernes, 07:00 a 18:00',
    activo: true,
  },
  {
    id: 'esp-auditorio',
    nombre: 'Auditorio (fuera de servicio)',
    descripcion: 'Espacio de prueba inactivo: no debe ofrecerse para reservar.',
    capacidad: 80,
    horario: 'Por confirmar con la biblioteca',
    activo: false,
  },
];
