/**
 * Espacios de la biblioteca y su disponibilidad (HU-16 y HU-17).
 * Para la comunidad solo se ofrecen los espacios activos.
 * La disponibilidad se calcula con los parámetros de HU-28, las reservas de HU-18/HU-19
 * y los bloqueos de HU-20, sin revelar datos de quien reservó (HU-17, CA3).
 * La ruta de la API es provisional: confirmarla con el equipo de Backend.
 */
import type {
  Bloqueo,
  DiaDisponibilidad,
  Espacio,
  EstadoFranja,
  EstadoSolicitud,
  FranjaDisponibilidad,
  Parametros,
  Reserva,
} from '@/types';
import { esDiaHabil, motivoNoDisponible } from '@/utils/parametros';

import { obtenerBloqueos } from './bloqueos';
import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { ESPACIOS } from './mocks/espacios';
import { obtenerParametros } from './parametros';
import { obtenerSolicitudesReserva, reservasAfectadasPorBloqueo } from './reservas';

/** Copia mutable: con mocks, los cambios de la administración se ven durante la sesión. */
let espacios: Espacio[] = ESPACIOS.map((espacio) => ({ ...espacio }));

/** Estados de reserva que ocupan una franja (igual que hayChoque() de HU-19). */
const ESTADOS_QUE_OCUPAN: readonly EstadoSolicitud[] = ['pendiente', 'aprobada', 'nueva_fecha'];

/** Espacios activos para la comunidad (HU-17, CA1). */
export function obtenerEspacios(): Promise<Espacio[]> {
  if (USAR_MOCKS) {
    return simularRed(espacios.filter((espacio) => espacio.activo).map((e) => ({ ...e })));
  }
  return peticion<Espacio[]>('/espacios/');
}

/** 'HH:MM' → minutos desde las 00:00. */
function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/** Minutos desde las 00:00 → 'HH:MM'. */
function aHora(minutos: number): string {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0');
  const m = String(minutos % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/** Fechas 'AAAA-MM-DD' del rango, ambas incluidas. */
function fechasEntre(desde: string, hasta: string): string[] {
  const [a, m, d] = desde.split('-').map(Number);
  const [af, mf, df] = hasta.split('-').map(Number);
  const cursor = new Date(Date.UTC(a, m - 1, d));
  const fin = new Date(Date.UTC(af, mf - 1, df));
  const fechas: string[] = [];
  while (cursor <= fin) {
    fechas.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return fechas;
}

/** ¿Se cruzan las franjas [inicio, fin) y [otroInicio, otroFin)? */
function seCruzan(inicio: number, fin: number, otroInicio: number, otroFin: number): boolean {
  return inicio < otroFin && otroInicio < fin;
}

/**
 * Franjas de 1 hora de un día hábil, con su estado y motivo.
 * Las reservas y los bloqueos deben ser solo los del espacio consultado.
 */
function franjasDelDia(
  fecha: string,
  parametros: Parametros,
  reservas: Reserva[],
  bloqueos: Bloqueo[],
  minimo: Date,
): FranjaDisponibilidad[] {
  const dia = new Date(`${fecha}T00:00:00`).getDay();
  const horario = parametros.horarios.find((h) => h.dia === dia);
  if (!horario) return [];

  const franjas: FranjaDisponibilidad[] = [];
  const abre = aMinutos(horario.abre);
  const cierra = aMinutos(horario.cierra);

  for (let inicio = abre; inicio + 60 <= cierra; inicio += 60) {
    const fin = inicio + 60;

    const bloqueo = bloqueos.find(
      (b) =>
        fecha >= b.desde &&
        fecha <= b.hasta &&
        (!b.horaInicio ||
          !b.horaFin ||
          seCruzan(inicio, fin, aMinutos(b.horaInicio), aMinutos(b.horaFin))),
    );

    const reserva = reservas.find(
      (r) =>
        r.fecha === fecha &&
        ESTADOS_QUE_OCUPAN.includes(r.estado) &&
        seCruzan(inicio, fin, aMinutos(r.horaInicio), aMinutos(r.horaFin)),
    );

    const inicioFechaHora = new Date(`${fecha}T${aHora(inicio)}:00`);
    let estado: EstadoFranja;
    let motivo: string | undefined;

    if (bloqueo) {
      estado = 'bloqueada';
      motivo = bloqueo.motivo;
    } else if (reserva) {
      estado = 'reservada';
    } else if (inicioFechaHora < minimo) {
      estado = 'no_disponible';
      motivo =
        inicioFechaHora < new Date()
          ? 'Ya pasó'
          : `Faltan menos de ${parametros.horasMinimasSolicitud} h para solicitarla`;
    } else {
      estado = 'disponible';
    }

    franjas.push({
      horaInicio: aHora(inicio),
      horaFin: aHora(fin),
      estado,
      ...(motivo ? { motivo } : {}),
    });
  }
  return franjas;
}

/**
 * Disponibilidad de un espacio entre dos fechas, ambas incluidas (HU-17).
 * No incluye datos de quien reservó (CA3).
 */
export async function obtenerDisponibilidad(
  espacioId: string,
  desde: string,
  hasta: string,
): Promise<DiaDisponibilidad[]> {
  if (!USAR_MOCKS) {
    return peticion<DiaDisponibilidad[]>(
      `/espacios/${espacioId}/disponibilidad/?desde=${desde}&hasta=${hasta}`,
    );
  }

  const espacio = espacios.find((e) => e.id === espacioId && e.activo);
  if (!espacio) {
    throw new ErrorApi(404, 'El espacio no existe o está inactivo.');
  }
  if (desde > hasta) return [];

  const [parametros, todasLasReservas, bloqueos] = await Promise.all([
    obtenerParametros(),
    obtenerSolicitudesReserva('todas'),
    obtenerBloqueos(espacioId),
  ]);
  // La bandeja trae las reservas de todos los espacios: solo cuentan las de este.
  const reservas = todasLasReservas.filter((r) => r.espacioId === espacioId);
  const minimo = new Date(Date.now() + parametros.horasMinimasSolicitud * 60 * 60 * 1000);

  return fechasEntre(desde, hasta).map((fecha) => {
    if (!esDiaHabil(fecha, parametros)) {
      return {
        fecha,
        habil: false,
        motivo: motivoNoDisponible(fecha, parametros) ?? undefined,
        franjas: [],
      };
    }
    return {
      fecha,
      habil: true,
      franjas: franjasDelDia(fecha, parametros, reservas, bloqueos, minimo),
    };
  });
}

// ── Administración del catálogo de espacios (HU-16) ──────────────────────────

/** Datos que envía el formulario de la administración; el id lo asigna el sistema. */
export type DatosEspacio = Omit<Espacio, 'id'>;

/** Resultado de activar o desactivar un espacio (HU-16, CA3). */
export type ResultadoCambioEstado = {
  espacio: Espacio;
  /** Reservas futuras afectadas al desactivar; vacío al activar o si no hay. */
  reservasFuturas: Reserva[];
};

/** Todos los espacios, también los inactivos, para la administración (HU-16). */
export function obtenerTodosLosEspacios(): Promise<Espacio[]> {
  if (USAR_MOCKS) {
    return simularRed(espacios.map((espacio) => ({ ...espacio })));
  }
  return peticion<Espacio[]>('/espacios/?todos=1');
}

/** Validación de la HU-16 (CA2): datos e imagen. */
function errorDeValidacion(datos: DatosEspacio): ErrorApi | null {
  if (!datos.nombre?.trim()) {
    return new ErrorApi(400, 'El nombre es obligatorio.');
  }
  if (!datos.descripcion?.trim()) {
    return new ErrorApi(400, 'La descripción es obligatoria.');
  }
  if (!datos.horario?.trim()) {
    return new ErrorApi(400, 'El horario es obligatorio.');
  }
  if (!Number.isInteger(datos.capacidad) || datos.capacidad <= 0) {
    return new ErrorApi(400, 'La capacidad debe ser un número entero mayor que cero.');
  }
  if (datos.foto != null && datos.foto.trim() === '') {
    return new ErrorApi(400, 'La fotografía no es válida.');
  }
  return null;
}

export function crearEspacio(datos: DatosEspacio): Promise<Espacio> {
  if (USAR_MOCKS) {
    const error = errorDeValidacion(datos);
    if (error) {
      return Promise.reject(error);
    }
    const nuevo: Espacio = { ...datos, id: `esp-${Date.now()}` };
    espacios = [...espacios, nuevo];
    return simularRed({ ...nuevo });
  }
  return peticion<Espacio>('/espacios/', { method: 'POST', body: JSON.stringify(datos) });
}

export function editarEspacio(id: string, datos: DatosEspacio): Promise<Espacio> {
  if (USAR_MOCKS) {
    const indice = espacios.findIndex((espacio) => espacio.id === id);
    if (indice === -1) {
      return Promise.reject(new ErrorApi(404, 'El espacio no existe.'));
    }
    const error = errorDeValidacion(datos);
    if (error) {
      return Promise.reject(error);
    }
    espacios = espacios.map((espacio, i) => (i === indice ? { ...datos, id } : espacio));
    return simularRed({ ...espacios[indice] });
  }
  return peticion<Espacio>(`/espacios/${id}/`, { method: 'PUT', body: JSON.stringify(datos) });
}

/** Reservas futuras que ocupan un espacio (HU-16, CA3). */
export function reservasFuturasDeEspacio(espacioId: string): Promise<Reserva[]> {
  if (USAR_MOCKS) {
    const hoy = new Date().toISOString().slice(0, 10);
    return simularRed(
      reservasAfectadasPorBloqueo({ espacioId, desde: hoy, hasta: '9999-12-31' }),
    );
  }
  return peticion<Reserva[]>(`/espacios/${espacioId}/reservas-futuras/`);
}

/**
 * Activa o desactiva un espacio (HU-16, CA3). Al desactivar devuelve las reservas
 * futuras afectadas, para que la pantalla advierta antes de confirmar.
 */
export async function cambiarEstadoEspacio(
  id: string,
  activo: boolean,
): Promise<ResultadoCambioEstado> {
  if (USAR_MOCKS) {
    const indice = espacios.findIndex((espacio) => espacio.id === id);
    if (indice === -1) {
      throw new ErrorApi(404, 'El espacio no existe.');
    }
    const reservasFuturas = activo ? [] : await reservasFuturasDeEspacio(id);
    espacios = espacios.map((espacio, i) => (i === indice ? { ...espacio, activo } : espacio));
    return simularRed({ espacio: { ...espacios[indice] }, reservasFuturas });
  }
  return peticion<ResultadoCambioEstado>(`/espacios/${id}/estado/`, {
    method: 'PATCH',
    body: JSON.stringify({ activo }),
  });
}
