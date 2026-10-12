/**
 * DATOS DE PRUEBA de los parámetros generales (HU-28).
 * Las fechas y horas son de ejemplo; la biblioteca confirmará los valores reales.
 */
import type { Parametros } from '@/types';

export const PARAMETROS: Parametros = {
  periodos: [
    { id: 'per-2026-2', nombre: '2026-2', inicio: '2026-08-03', fin: '2026-11-28' },
    { id: 'per-2027-1', nombre: '2027-1', inicio: '2027-02-01', fin: '2027-06-05' },
  ],
  festivos: [
    { fecha: '2026-10-13', motivo: 'Semana de receso' },
    { fecha: '2026-11-02', motivo: 'Día festivo institucional' },
  ],
  horarios: [
    { dia: 1, abre: '07:00', cierra: '18:00' },
    { dia: 2, abre: '07:00', cierra: '18:00' },
    { dia: 3, abre: '07:00', cierra: '18:00' },
    { dia: 4, abre: '07:00', cierra: '18:00' },
    { dia: 5, abre: '07:00', cierra: '17:00' },
  ],
  horasMinimasSolicitud: 24,
  horasMinimasCancelacion: 12,
  textoRecordatorio: 'Recuerda tu compromiso con la biblioteca.',
  textoCancelacion: 'Tu solicitud fue cancelada.',
};
