/**
 * Historial de las solicitudes (HU-08, CA2): un evento por cada cambio de estado de una
 * reserva, cita, préstamo o capacitación. Es el único almacén de historial: las demás capas
 * de datos llaman a registrarEvento() y no guardan historiales propios.
 * Con la API real, el Backend registra los eventos y la app solo los lee. La ruta es
 * provisional: confírmenla con el equipo de Backend.
 */
import type { EstadoPrestamo, EstadoSolicitud, EventoSolicitud, TipoSolicitud } from '@/types';
import { ahoraFechaHora } from '@/utils/tablets';

import { peticion, simularRed, USAR_MOCKS } from './cliente';
import { HISTORIAL_SOLICITUDES } from './mocks/historial';

/** Un evento guardado con la solicitud a la que pertenece; al devolverlo se quitan esas claves. */
export type EventoGuardado = EventoSolicitud & {
  tipo: TipoSolicitud;
  solicitudId: string;
};

/** Copia mutable: con mocks, los eventos nuevos se ven durante la sesión. */
let eventos: EventoGuardado[] = HISTORIAL_SOLICITUDES.map((evento) => ({ ...evento }));

/**
 * El estado común (EstadoSolicitud) de un préstamo de tablet, que tiene estados propios.
 * Reservado, entregado y vencido siguen en curso (aprobada); devuelto es realizada. El estado
 * real del préstamo va en la nota de cada evento del historial.
 */
export function estadoDePrestamo(estado: EstadoPrestamo): EstadoSolicitud {
  switch (estado) {
    case 'devuelto':
      return 'realizada';
    case 'cancelado':
      return 'cancelada';
    default:
      return 'aprobada';
  }
}

function aEvento({ id, fecha, estado, autor, nota }: EventoGuardado): EventoSolicitud {
  return { id, fecha, estado, autor, ...(nota ? { nota } : {}) };
}

/**
 * Agrega un evento al historial de una solicitud y devuelve una copia. Se llama después de
 * cambiar el estado, solo con mocks. `fecha` por defecto es ahora ('AAAA-MM-DD HH:MM').
 */
export function registrarEvento(
  tipo: TipoSolicitud,
  solicitudId: string,
  estado: EstadoSolicitud,
  autor: string,
  nota?: string,
  fecha: string = ahoraFechaHora(),
): EventoSolicitud {
  const evento: EventoGuardado = {
    id: `evt-${Date.now()}-${eventos.length + 1}`,
    tipo,
    solicitudId,
    fecha,
    estado,
    autor,
    ...(nota?.trim() ? { nota: nota.trim() } : {}),
  };
  eventos = [...eventos, evento];
  return aEvento(evento);
}

/** Historial de una solicitud, del evento más antiguo al más reciente; sin eventos, []. */
export function obtenerHistorialSolicitud(
  tipo: TipoSolicitud,
  id: string,
): Promise<EventoSolicitud[]> {
  if (USAR_MOCKS) {
    // sort es estable: dos eventos del mismo minuto quedan en el orden en que se registraron.
    const lista = eventos
      .filter((evento) => evento.tipo === tipo && evento.solicitudId === id)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
    return simularRed(lista.map(aEvento));
  }
  return peticion<EventoSolicitud[]>(`/solicitudes/${tipo}/${id}/historial/`);
}
