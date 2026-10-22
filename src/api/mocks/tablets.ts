/**
 * DATOS DE PRUEBA de tablets y préstamos (HU-21, HU-22, HU-23 y HU-24).
 *
 * PROVISIONAL: la cantidad, los códigos, seriales, modelos, accesorios, el plazo y el texto
 * de las condiciones de uso se esperan por confirmar con la biblioteca (sección 2 del
 * documento de la iteración 3).
 */
import type { CondicionesTablet, PrestamoTablet, Tablet } from '@/types';

export const CONDICIONES_TABLET: CondicionesTablet = {
  titulo: 'Condiciones de uso del préstamo de tablets',
  texto: [
    'La tablet se presta para usarla dentro de la biblioteca.',
    'Devuélvela en la franja acordada y con todos sus accesorios.',
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
    estado: 'prestada',
  },
  {
    id: 'tab-3',
    codigo: 'TAB-003',
    serial: 'SN-LEN-M11-001',
    modelo: 'Lenovo Tab M11',
    accesorios: ['cargador', 'estuche'],
    estado: 'mantenimiento',
  },
  {
    id: 'tab-4',
    codigo: 'TAB-004',
    serial: 'SN-LEN-M11-002',
    modelo: 'Lenovo Tab M11',
    accesorios: ['cargador'],
    estado: 'disponible',
  },
];

export const PRESTAMOS_TABLET: PrestamoTablet[] = [
  {
    id: 'pre-1',
    tabletId: 'tab-1',
    solicitanteId: 'u-estudiante',
    solicitante: 'Laura Pérez',
    fecha: '2026-10-23',
    horaInicio: '09:00',
    horaFin: '11:00',
    condicionesAceptadas: true,
    estado: 'aprobada',
  },
  {
    id: 'pre-2',
    tabletId: 'tab-2',
    solicitanteId: 'u-docente',
    solicitante: 'Carlos Ramírez',
    fecha: '2026-10-20',
    horaInicio: '14:00',
    horaFin: '16:00',
    condicionesAceptadas: true,
    estado: 'aprobada',
    entregadaEn: '2026-10-20 14:05',
    entrega: {
      condicion: 'bueno',
      accesorios: ['cargador'],
      observaciones: 'Sin novedad al entregar.',
    },
  },
  {
    id: 'pre-3',
    tabletId: 'tab-3',
    solicitanteId: 'u-estudiante',
    solicitante: 'Laura Pérez',
    fecha: '2026-10-18',
    horaInicio: '10:00',
    horaFin: '12:00',
    condicionesAceptadas: true,
    estado: 'realizada',
    entregadaEn: '2026-10-18 10:02',
    entrega: {
      condicion: 'bueno',
      accesorios: ['cargador', 'estuche'],
    },
    devueltaEn: '2026-10-18 12:10',
    devolucion: {
      condicion: 'regular',
      accesorios: ['cargador', 'estuche'],
      observaciones: 'La pantalla tiene una marca leve.',
    },
    novedades: 'Marca leve en la pantalla.',
    retrasoMinutos: 10,
  },
  {
    id: 'pre-4',
    tabletId: 'tab-4',
    solicitanteId: 'u-estudiante-2',
    solicitante: 'Andrés Mejía',
    fecha: '2026-10-24',
    horaInicio: '15:00',
    horaFin: '17:00',
    condicionesAceptadas: true,
    estado: 'pendiente',
  },
];
