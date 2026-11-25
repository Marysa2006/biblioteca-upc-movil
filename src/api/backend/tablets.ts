import { firmaDesdeBackend, firmaHaciaBackend, type FirmaBackend } from './firmas';
/**
 * Préstamo de tablets del Backend traducido a la app (HU-22 y HU-24, versión 1.1). Funciones
 * puras.
 *
 * - Disponibilidad: `GET /tablets/availability/?date=&hours=1` da, cada 30 minutos, cuántas
 *   tablets quedan libres para un préstamo de 1 hora; la app arma sus franjas de una hora con eso
 *   y calcula cuántas horas seguidas se pueden pedir, como con sus datos de prueba.
 * - Préstamo (`Loan`): la tablet se asigna al entregarla. En la app, su id es el `request_id`, el
 *   de «Mis solicitudes».
 * - Un 409 (`NoTablet`) trae los siguientes horarios con tablets (`next_slots`).
 */
import type {
  CondicionTablet, DatosSolicitante, EstadoEquipo, EstadoFranja, EstadoPrestamo,
  EstadoTablet, FirmaElectronica, Prestamo, RegistroTablet, Tablet,
} from '@/types';
import { aMinutos } from '@/utils/franjas';

import { datosSolicitanteHaciaBackend } from './espacios';
import { horaDesdeBackend, sedeDesdeBackend, type EstadoBackend } from './equivalencias';

export type DisponibilidadTabletsBackend = {
  date: string;
  slots: { start: string; end: string; available: number }[];
  message?: string | null;
};

export type FranjaTabletsApp = {
  horaInicio: string;
  horaFin: string;
  estado: EstadoFranja;
  libres: number;
  total: number;
  motivo?: string;
};

/**
 * Las franjas de un día. El Backend no dice cuántas tablets hay en total: se usa el mayor número
 * libre del día. Una hora de inicio que ya pasó no se ofrece.
 */
export function franjasTabletsDesdeBackend(
  dia: DisponibilidadTabletsBackend,
  ahora: Date = new Date(),
): FranjaTabletsApp[] {
  const total = Math.max(0, ...dia.slots.map((franja) => franja.available));
  return dia.slots.map((franja) => {
    const horaInicio = horaDesdeBackend(franja.start);
    const empieza = new Date(`${dia.date}T${horaInicio}:00`);
    let estado: EstadoFranja = 'disponible';
    let motivo: string | undefined;
    if (empieza < ahora) {
      estado = 'no_disponible';
      motivo = 'Ya pasó';
    } else if (franja.available === 0) {
      estado = 'reservada';
      motivo = 'No quedan tablets libres en esta franja.';
    }
    return {
      horaInicio,
      horaFin: horaDesdeBackend(franja.end),
      estado,
      libres: franja.available,
      total,
      ...(motivo ? { motivo } : {}),
    };
  });
}

/** Lo que manda la comunidad al pedir una tablet (`LoanRequest`). */
export function prestamoHaciaBackend(datos: {
  fecha: string;
  horaInicio: string;
  horas: number;
  aceptaCondiciones: boolean;
  responsabilidadAceptada: boolean;
  datosSolicitante: DatosSolicitante;
}) {
  return {
    date: datos.fecha,
    start_time: datos.horaInicio,
    hours: datos.horas,
    // El Backend tiene un solo «acepto»: las condiciones y la responsabilidad van juntas.
    accept_terms: datos.aceptaCondiciones && datos.responsabilidadAceptada,
    ...datosSolicitanteHaciaBackend(datos.datosSolicitante),
  };
}

export type PrestamoBackend = {
  id: number;
  request_id: number;
  status: EstadoBackend;
  tablet: string | null;
  tablet_model: string | null;
  reserved_date: string;
  start_time: string;
  due_date: string;
  due_time: string;
  conditions_accepted_at: string | null;
};

/** El estado del préstamo en la app: reservado, entregado, vencido, devuelto o cancelado. */
export const ESTADO_PRESTAMO: Record<EstadoBackend, EstadoPrestamo> = {
  PENDING: 'reservado',
  APPROVED: 'reservado',
  RESCHEDULE_PROPOSED: 'reservado',
  IN_PROGRESS: 'entregado',
  OVERDUE: 'vencido',
  COMPLETED: 'devuelto',
  CANCELLED: 'cancelado',
  REJECTED: 'cancelado',
};

export function prestamoDesdeBackend(
  prestamo: PrestamoBackend,
  solicitante: { id: string; nombre: string },
): Prestamo {
  const horaInicio = horaDesdeBackend(prestamo.start_time);
  const horaLimite = horaDesdeBackend(prestamo.due_time);
  return {
    id: String(prestamo.request_id),
    // La tablet se asigna al entregarla: antes no hay; después, su código interno.
    tabletId: prestamo.tablet ?? '',
    solicitanteId: solicitante.id,
    solicitante: solicitante.nombre,
    fecha: prestamo.reserved_date,
    horaInicio,
    horaLimite,
    condicionesAceptadas: prestamo.conditions_accepted_at != null,
    estado: ESTADO_PRESTAMO[prestamo.status],
    horas: Math.round((aMinutos(horaLimite) - aMinutos(horaInicio)) / 60),
  };
}

type EstadoTabletBackend = 'OPERATIONAL' | 'MAINTENANCE' | 'DAMAGED' | 'RETIRED';
type CondicionBackend = 'GOOD' | 'MINOR_ISSUES' | 'DAMAGED';
type EstadoEquipoBackend = 'NEW' | 'OPTIMAL' | 'OTHER';

export type TabletBackend = {
  id: number;
  internal_code: string;
  serial: string;
  model: string;
  accessories?: string;
  operational_status: EstadoTabletBackend;
  device_type?: string;
  brand?: string;
  asset_value?: number | null;
};

const ESTADO_TABLET_DESDE: Record<EstadoTabletBackend, EstadoTablet> = {
  OPERATIONAL: 'disponible', MAINTENANCE: 'mantenimiento', DAMAGED: 'mantenimiento', RETIRED: 'de_baja',
};
const CONDICION_DESDE: Record<CondicionBackend, CondicionTablet> = {
  GOOD: 'bueno', MINOR_ISSUES: 'regular', DAMAGED: 'danado',
};
const EQUIPO_DESDE: Record<EstadoEquipoBackend, EstadoEquipo> = {
  NEW: 'nuevo', OPTIMAL: 'optimo', OTHER: 'otro',
};
const EQUIPO_HACIA = { nuevo: 'NEW', optimo: 'OPTIMAL', otro: 'OTHER' } as const;
const CONDICION_HACIA = { bueno: 'GOOD', regular: 'MINOR_ISSUES', danado: 'DAMAGED' } as const;

export function estadoTabletHaciaBackend(estado: EstadoTablet): EstadoTabletBackend {
  if (estado === 'mantenimiento') return 'MAINTENANCE';
  if (estado === 'de_baja') return 'RETIRED';
  return 'OPERATIONAL';
}

function leerAccesorios(valor?: string) {
  return (valor ?? '').split(/[,;\n]+/).map((accesorio) => accesorio.trim()).filter(Boolean);
}

export function tabletInventarioDesdeBackend(tablet: TabletBackend, prestada = false): Tablet {
  return {
    id: String(tablet.id),
    codigo: tablet.internal_code,
    serial: tablet.serial,
    modelo: tablet.model,
    accesorios: leerAccesorios(tablet.accessories),
    estado: tablet.operational_status === 'OPERATIONAL' && prestada
      ? 'en_prestamo' : ESTADO_TABLET_DESDE[tablet.operational_status],
    tipo: tablet.device_type || undefined,
    marca: tablet.brand || undefined,
    valor: tablet.asset_value ?? undefined,
  };
}

export function tabletHaciaBackend(tablet: Omit<Tablet, 'id'>) {
  return {
    internal_code: tablet.codigo,
    serial: tablet.serial,
    model: tablet.modelo,
    accessories: tablet.accesorios.join('\n'),
    operational_status: estadoTabletHaciaBackend(tablet.estado),
    device_type: tablet.tipo ?? '',
    brand: tablet.marca ?? '',
    asset_value: tablet.valor ?? null,
  };
}

type RegistroBackend = {
  device_condition: CondicionBackend;
  accessories: string;
  observations: string;
  responsible: string;
  responsible_position: string;
  responsible_signature?: FirmaBackend | null;
};
type EntregaBackend = RegistroBackend & {
  delivered_at: string;
  format_condition: EstadoEquipoBackend | '';
  signature: FirmaBackend | null;
};
type DevolucionBackend = RegistroBackend & {
  returned_at: string;
  is_late: boolean;
  late_minutes: number;
};
export type PrestamoPersonalBackend = PrestamoBackend & {
  requester: string;
  requester_email: string;
  requester_institutional_id: string;
  requester_program: string;
  contact_phone?: string;
  campus?: string;
  faculty?: string;
  program?: string;
  semester?: string;
  tablet_serial: string | null;
  tablet_brand: string | null;
  tablet_device_type: string | null;
  tablet_asset_value: number | null;
  delivery: EntregaBackend | null;
  return_record: DevolucionBackend | null;
  receipt_code: string;
};

function fechaHoraLocal(fecha: string) {
  return `${fecha.slice(0, 10)} ${fecha.slice(11, 16)}`;
}

function registroDesdeBackend(registro: RegistroBackend, fecha: string): RegistroTablet {
  return {
    fechaHora: fechaHoraLocal(fecha),
    condicion: CONDICION_DESDE[registro.device_condition],
    accesorios: leerAccesorios(registro.accessories),
    novedades: registro.observations || undefined,
    firmaResponsable: firmaDesdeBackend(registro.responsible_signature),
    responsable: registro.responsible
      ? { id: '', nombre: registro.responsible, cargo: registro.responsible_position || undefined }
      : undefined,
  };
}

export function prestamoPersonalDesdeBackend(registro: PrestamoPersonalBackend, tabletId?: string): Prestamo {
  const { delivery, return_record: devolucion } = registro;
  const firma = delivery?.signature;
  return {
    ...prestamoDesdeBackend(registro, { id: registro.requester_email, nombre: registro.requester }),
    tabletId: tabletId ?? registro.tablet ?? '',
    datosSolicitante: {
      tipo: 'visitante',
      nombreCompleto: registro.requester,
      identificacion: registro.requester_institutional_id,
      correo: registro.requester_email,
      celular: registro.contact_phone ?? '',
      sede: sedeDesdeBackend(registro.campus),
      facultad: registro.faculty || undefined,
      programa: registro.program || registro.requester_program || undefined,
      semestre: Number(registro.semester) || undefined,
    },
    entrega: delivery ? {
      ...registroDesdeBackend(delivery, delivery.delivered_at),
      firmaUsuario: firmaDesdeBackend(firma),
    } : undefined,
    devolucion: devolucion ? {
      ...registroDesdeBackend(devolucion, devolucion.returned_at),
      tardia: devolucion.is_late,
      retrasoMinutos: devolucion.late_minutes,
    } : undefined,
    estadoEquipo: delivery?.format_condition ? EQUIPO_DESDE[delivery.format_condition] : undefined,
    notas: delivery?.observations || undefined,
  };
}

export function registroTabletHaciaBackend(datos: Pick<RegistroTablet, 'condicion' | 'accesorios'>) {
  return { device_condition: CONDICION_HACIA[datos.condicion], accessories: datos.accesorios.join('\n') };
}

export function entregaTabletHaciaBackend(
  codigo: string,
  datos: Pick<RegistroTablet, 'condicion' | 'accesorios' | 'firmaUsuario'> & {
    estadoEquipo?: EstadoEquipo; notas?: string;
  },
) {
  const firma: FirmaElectronica | undefined = datos.firmaUsuario;
  return {
    ...registroTabletHaciaBackend(datos),
    tablet: codigo,
    format_condition: datos.estadoEquipo ? EQUIPO_HACIA[datos.estadoEquipo] : '',
    observations: datos.notas?.trim() ?? '',
    signature: firmaHaciaBackend(firma ?? null),
  };
}

/** Los siguientes horarios con tablets de un 409, como alternativas de la app. */
export function alternativasTabletDesdeBackend(
  tramos: { date: string; start: string; end: string }[],
) {
  return tramos.map((tramo) => ({
    fecha: tramo.date,
    horaInicio: horaDesdeBackend(tramo.start),
    horaLimite: horaDesdeBackend(tramo.end),
  }));
}

export const TIPOS_INCIDENCIA_TABLET = {
  OVERDUE: 'Préstamo vencido',
  LATE_RETURN: 'Devolución tardía',
  DAMAGE: 'Daño',
  MISSING_ACCESSORY: 'Accesorio faltante',
  LOSS: 'Pérdida',
  OTHER: 'Otra',
} as const;

export type TipoIncidenciaTablet = keyof typeof TIPOS_INCIDENCIA_TABLET;
export type IncidenciaTabletBackend = {
  id: number;
  loan_id: number;
  request_id: number;
  tablet: string | null;
  requester: string;
  incident_type: TipoIncidenciaTablet;
  incident_type_display: string;
  description: string;
  reported_by: string | null;
  created_at: string;
};

export function incidenciaTabletDesdeBackend(incidencia: IncidenciaTabletBackend) {
  return {
    id: String(incidencia.id),
    prestamoId: String(incidencia.loan_id),
    solicitudId: String(incidencia.request_id),
    tablet: incidencia.tablet,
    solicitante: incidencia.requester,
    tipo: incidencia.incident_type,
    etiqueta: incidencia.incident_type_display,
    descripcion: incidencia.description,
    reporto: incidencia.reported_by,
    fechaHora: fechaHoraLocal(incidencia.created_at),
  };
}
