/**
 * DATOS DE PRUEBA de tablets y préstamos (HU-21, HU-22, HU-23 y HU-24).
 *
 * PROVISIONAL: la cantidad, los códigos, seriales, modelos, accesorios, el plazo y el texto
 * de las condiciones de uso se esperan por confirmar con la biblioteca (sección 2 del
 * documento de la iteración 3).
 */
import type { CondicionesTablet, Prestamo, Tablet } from '@/types';

export const CONDICIONES_TABLET: CondicionesTablet = {
  titulo: 'Condiciones de uso del préstamo de tablets',
  texto: [
    'La tablet se presta para usarla dentro de la biblioteca.',
    'Devuélvela antes de la hora límite y con todos sus accesorios.',
    'Si el equipo se daña o falta un accesorio, repórtalo al entregarlo.',
    'El préstamo vencido genera un recordatorio y puede impedir nuevos préstamos.',
  ].join('\n'),
  actualizada: '2026-10-21',
};

export const TABLETS: Tablet[] = [
  {
    id: 'tab-1',
    codigo: 'TAB-001',
    serial: 'SN-SAM-A9-001',
    modelo: 'Samsung Galaxy Tab A9',
    accesorios: ['cargador', 'estuche'],
    estado: 'disponible',
  },
  {
    id: 'tab-2',
    codigo: 'TAB-002',
    serial: 'SN-SAM-A9-002',
    modelo: 'Samsung Galaxy Tab A9',
    accesorios: ['cargador'],
    estado: 'en_prestamo',
  },
  {
    id: 'tab-3',
    codigo: 'TAB-003',
    serial: 'SN-LEN-M11-001',
    modelo: 'Lenovo Tab M11',
    accesorios: ['cargador', 'estuche'],
    estado: 'en_prestamo',
  },
  {
    id: 'tab-4',
    codigo: 'TAB-004',
    serial: 'SN-LEN-M11-002',
    modelo: 'Lenovo Tab M11',
    accesorios: ['cargador'],
    estado: 'disponible',
  },
  {
    id: 'tab-5',
    codigo: 'TAB-005',
    serial: 'SN-SAM-A9-003',
    modelo: 'Samsung Galaxy Tab A9',
    accesorios: ['cargador'],
    estado: 'mantenimiento',
  },
  {
    id: 'tab-6',
    codigo: 'TAB-006',
    serial: 'SN-LEN-M11-003',
    modelo: 'Lenovo Tab M11',
    accesorios: ['cargador'],
    estado: 'de_baja',
  },
];

export const PRESTAMOS_TABLET: Prestamo[] = [
  {
    id: 'pre-1',
    tabletId: 'tab-1',
    solicitanteId: 'u-estudiante',
    solicitante: 'Laura Pérez',
    fecha: '2026-10-24',
    horaInicio: '09:00',
    horaLimite: '11:00',
    condicionesAceptadas: true,
    estado: 'reservado',
  },
  {
    id: 'pre-2',
    tabletId: 'tab-2',
    solicitanteId: 'u-docente',
    solicitante: 'Carlos Ramírez',
    fecha: '2026-10-23',
    horaInicio: '15:00',
    horaLimite: '18:00',
    condicionesAceptadas: true,
    estado: 'entregado',
    entrega: {
      fechaHora: '2026-10-23 15:05',
      condicion: 'bueno',
      accesorios: ['cargador'],
    },
  },
  {
    id: 'pre-3',
    tabletId: 'tab-3',
    solicitanteId: 'u-estudiante-2',
    solicitante: 'Andrés Mejía',
    fecha: '2026-10-22',
    horaInicio: '10:00',
    horaLimite: '12:00',
    condicionesAceptadas: true,
    estado: 'vencido',
    entrega: {
      fechaHora: '2026-10-22 10:03',
      condicion: 'bueno',
      accesorios: ['cargador', 'estuche'],
    },
  },
  {
    id: 'pre-4',
    tabletId: 'tab-4',
    solicitanteId: 'u-estudiante',
    solicitante: 'Laura Pérez',
    fecha: '2026-10-22',
    horaInicio: '14:00',
    horaLimite: '16:00',
    condicionesAceptadas: true,
    estado: 'devuelto',
    entrega: {
      fechaHora: '2026-10-22 14:02',
      condicion: 'bueno',
      accesorios: ['cargador'],
    },
    devolucion: {
      fechaHora: '2026-10-22 16:15',
      condicion: 'regular',
      accesorios: ['cargador'],
      novedades: 'La pantalla tiene una marca leve.',
      tardia: true,
      retrasoMinutos: 15,
    },
  },
];
