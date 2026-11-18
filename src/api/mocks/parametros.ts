/**
 * DATOS DE PRUEBA de los parámetros generales (HU-28).
 * El horario de atención y los plazos son los que confirmó la biblioteca (15 de noviembre de 2026);
 * los periodos y los festivos institucionales siguen siendo de ejemplo.
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
    // Festivos de Colombia que quedan en 2026.
    { fecha: '2026-11-16', motivo: 'Independencia de Cartagena' },
    { fecha: '2026-12-08', motivo: 'Día de la Inmaculada Concepción' },
    { fecha: '2026-12-25', motivo: 'Navidad' },
  ],
  horarios: [
    { dia: 1, abre: '07:00', cierra: '21:00' },
    { dia: 2, abre: '07:00', cierra: '21:00' },
    { dia: 3, abre: '07:00', cierra: '21:00' },
    { dia: 4, abre: '07:00', cierra: '21:00' },
    { dia: 5, abre: '07:00', cierra: '21:00' },
    { dia: 6, abre: '08:00', cierra: '14:00' },
  ],
  // 3 días para solicitar y 1 día para cancelar, iguales para todos los servicios.
  horasMinimasSolicitud: 72,
  horasMinimasCancelacion: 24,
  textoRecordatorio: 'Recuerda tu compromiso con la biblioteca.',
  textoCancelacion: 'Tu solicitud fue cancelada.',
  // El formato de constancia de la biblioteca dice 3 horas (versión 1.1).
  horasMaximasPrestamo: 3,
};
