/**
 * Espacios de la biblioteca y su disponibilidad (HU-16 y HU-17).
 * Para la comunidad solo se ofrecen los espacios activos.
 * La disponibilidad se calcula con los parámetros de HU-28, las reservas de HU-18/HU-19
 * y los bloqueos de HU-20, sin revelar datos de quien reservó (HU-17, CA3).
 *
 * Con la API (módulo `espacios` de `usaApi()`): el catálogo, la disponibilidad y la solicitud de
 * reserva de la comunidad van contra el Backend (src/api/backend/espacios.ts), junto con «Mis
 * reservas» (src/api/reservas.ts), porque las reservas apuntan a los espacios. La administración
 * de espacios sigue con datos de prueba hasta la fase 4.
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
  Usuario,
} from '@/types';
import { esFechaValida, esHoraValida, hoyISO } from '@/utils/fechas';
import { esDiaHabil, motivoNoDisponible } from '@/utils/parametros';
import {
  LARGO_MAXIMO_NOVEDADES_RESERVA,
  problemaRecursos,
  problemaSede,
} from '@/utils/reservas';
import { MENSAJE_NO_RESERVA_ESPACIOS, puedeReservarEspacios } from '@/utils/roles';
import { aDatosSolicitante, problemaSolicitante, valoresSolicitante } from '@/utils/solicitante';

import {
  alternativasDesdeBackend,
  cuerpoEspacio,
  diaDesdeDisponibilidad,
  espacioAdminDesdeBackend,
  espacioDesdeBackend,
  horariosHaciaBackend,
  mesesEntre,
  reservaDesdeBackend,
  reservaHaciaBackend,
  type DisponibilidadBackend,
  type EspacioAdminBackend,
  type EspacioBackend,
  type ReservaBackend,
} from './backend/espacios';
import { horaDesdeBackend } from './backend/equivalencias';
import { reservaPersonalDesdeBackend, type ReservaPersonalBackend } from './backend/reservas';
import { obtenerBloqueos } from './bloqueos';
import { ErrorApi, peticion, peticionTodas, simularRed, usaApi, USAR_MOCKS } from './cliente';
import { ESPACIOS } from './mocks/espacios';
import { obtenerParametros } from './parametros';
import {
  obtenerSolicitudesReserva,
  registrarSolicitudReserva,
  reservasAfectadasPorBloqueo,
  type DatosSolicitudReserva,
} from './reservas';

export type { DatosSolicitudReserva } from './reservas';

/** Copia mutable: con mocks, los cambios de la administración se ven durante la sesión. */
let espacios: Espacio[] = ESPACIOS.map((espacio) => ({ ...espacio }));

/** Estados de reserva que ocupan una franja (igual que hayChoque() de HU-19). */
const ESTADOS_QUE_OCUPAN: readonly EstadoSolicitud[] = ['pendiente', 'aprobada', 'nueva_fecha'];

/** Espacios activos para la comunidad (HU-17, CA1). */
export async function obtenerEspacios(): Promise<Espacio[]> {
  if (!usaApi('espacios')) {
    return simularRed(espacios.filter((espacio) => espacio.activo).map((e) => ({ ...e })));
  }
  const respuesta = await peticion<{ spaces: EspacioBackend[] }>('/spaces/');
  return respuesta.spaces.map(espacioDesdeBackend);
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
  if (usaApi('espacios')) {
    if (desde > hasta) return [];
    // Un pedido por mes (la vista mensual del Backend); se dejan los días del rango.
    const [parametros, ...meses] = await Promise.all([
      obtenerParametros(),
      ...mesesEntre(desde, hasta).map((mes) =>
        peticion<DisponibilidadBackend>(
          `/spaces/${encodeURIComponent(espacioId)}/availability/?view=month&date=${mes}`,
        ),
      ),
    ]);
    const minimo = new Date(Date.now() + parametros.horasMinimasSolicitud * 60 * 60 * 1000);
    return meses
      .flatMap((mes) => mes.days)
      .filter((dia) => dia.date >= desde && dia.date <= hasta)
      .map((dia) => diaDesdeDisponibilidad(dia, minimo, parametros.horasMinimasSolicitud));
  }
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

const RUTA_ESPACIOS_ADMIN = '/spaces/manage/';

async function guardarEspacioBackend(
  datos: DatosEspacio,
  id?: string,
  confirmar = false,
): Promise<Espacio> {
  const horarios = horariosHaciaBackend(datos.horario);
  if (!horarios) {
    throw new ErrorApi(400, 'Usa un horario como «Lunes a viernes, 08:00 a 17:00».');
  }
  const ruta = id ? `${RUTA_ESPACIOS_ADMIN}${encodeURIComponent(id)}/` : RUTA_ESPACIOS_ADMIN;
  const anterior = id ? await peticion<EspacioAdminBackend>(ruta) : undefined;
  const guardado = await peticion<EspacioAdminBackend>(ruta, {
    method: id ? 'PATCH' : 'POST',
    body: await cuerpoEspacio(datos, anterior),
  });
  const detalle = `${RUTA_ESPACIOS_ADMIN}${guardado.id}/`;
  const rutaHorarios = `${detalle}schedules/`;
  const actuales = guardado.schedules.filter((horario) => horario.is_active);
  const clave = (h: (typeof horarios)[number]) =>
    `${h.day_of_week}:${horaDesdeBackend(h.start_time)}-${horaDesdeBackend(h.end_time)}`;
  const deseados = new Set(horarios.map(clave));
  const existentes = new Set(actuales.map(clave));
  for (const horario of actuales) {
    if (!deseados.has(clave(horario))) {
      await peticion(`${rutaHorarios}${horario.id}/`, { method: 'DELETE' });
    }
  }
  for (const horario of horarios) {
    if (!existentes.has(clave(horario))) {
      await peticion(rutaHorarios, { method: 'POST', body: JSON.stringify(horario) });
    }
  }
  if (datos.activo !== (guardado.status === 'ACTIVE') &&
      !(guardado.status === 'MAINTENANCE' && !datos.activo)) {
    return (await cambiarEstadoEspacio(String(guardado.id), datos.activo, confirmar)).espacio;
  }
  return espacioAdminDesdeBackend(await peticion<EspacioAdminBackend>(detalle));
}

/** Resultado de activar o desactivar un espacio (HU-16, CA3). */
export type ResultadoCambioEstado = {
  espacio: Espacio;
  /** Reservas futuras afectadas al desactivar; vacío al activar o si no hay. */
  reservasFuturas: Reserva[];
};

/** Todos los espacios, también los inactivos, para la administración (HU-16). */
export function obtenerTodosLosEspacios(): Promise<Espacio[]> {
  if (usaApi('espacios')) return peticionTodas(RUTA_ESPACIOS_ADMIN, espacioAdminDesdeBackend);
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
  if (usaApi('espacios')) return guardarEspacioBackend(datos);
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

export function editarEspacio(id: string, datos: DatosEspacio, confirmar = false): Promise<Espacio> {
  if (usaApi('espacios')) return guardarEspacioBackend(datos, id, confirmar);
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

/** El Backend rechaza la eliminación si el espacio tiene reservas o bloqueos. */
export async function eliminarEspacio(id: string): Promise<void> {
  if (usaApi('espacios')) {
    await peticion(`${RUTA_ESPACIOS_ADMIN}${encodeURIComponent(id)}/`, { method: 'DELETE' });
    return;
  }
  if (!espacios.some((espacio) => espacio.id === id)) {
    throw new ErrorApi(404, 'El espacio no existe.');
  }
  const [reservas, bloqueos] = await Promise.all([obtenerSolicitudesReserva(), obtenerBloqueos(id)]);
  if (reservas.some((reserva) => reserva.espacioId === id) || bloqueos.length) {
    throw new ErrorApi(400, 'El espacio tiene reservas o bloqueos. Puedes desactivarlo.');
  }
  espacios = espacios.filter((espacio) => espacio.id !== id);
}

/** Reservas futuras que ocupan un espacio (HU-16, CA3). */
export function reservasFuturasDeEspacio(espacioId: string): Promise<Reserva[]> {
  if (usaApi('espacios')) {
    const consulta = `space=${encodeURIComponent(espacioId)}&date_from=${hoyISO()}`;
    return Promise.all(['PENDING', 'APPROVED', 'IN_PROGRESS'].map((status) =>
      peticionTodas<ReservaPersonalBackend, Reserva>(
        `/spaces/manage/reservations/?${consulta}&status=${status}`,
        reservaPersonalDesdeBackend,
      ),
    )).then((listas) => listas.flat());
  }
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
  confirmar = false,
): Promise<ResultadoCambioEstado> {
  if (usaApi('espacios')) {
    const reservasFuturas = activo ? [] : await reservasFuturasDeEspacio(id);
    const espacio = await peticion<EspacioAdminBackend>(
      `${RUTA_ESPACIOS_ADMIN}${encodeURIComponent(id)}/status/`,
      { method: 'POST', body: JSON.stringify({ status: activo ? 'ACTIVE' : 'INACTIVE', confirm: confirmar }) },
    );
    return { espacio: espacioAdminDesdeBackend(espacio), reservasFuturas };
  }
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

// ── Solicitud de reserva (HU-18) ───────────────────────────────────────────────

/**
 * Lo que llena el usuario en el formulario de reserva (HU-18).
 * Quién solicita sale de la sesión, no del formulario.
 */
export type FormularioReserva = Omit<DatosSolicitudReserva, 'solicitanteId' | 'solicitante'>;

/** Horario alternativo sugerido cuando el pedido no está disponible (CA2). */
export type AlternativaReserva = {
  fecha: string;
  horaInicio: string;
  horaFin: string;
};

/** Error 400 de la solicitud, con horarios alternativos (CA2). */
export class ErrorReserva extends ErrorApi {
  alternativas: AlternativaReserva[];

  constructor(mensaje: string, alternativas: AlternativaReserva[] = []) {
    super(400, mensaje);
    this.name = 'ErrorReserva';
    this.alternativas = alternativas;
  }
}

/** Suma días a una fecha 'AAAA-MM-DD'. */
function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number);
  const resultado = new Date(Date.UTC(a, m - 1, d));
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado.toISOString().slice(0, 10);
}

function duracionHoras(inicio: string, fin: string): number {
  return (aMinutos(fin) - aMinutos(inicio)) / 60;
}

/**
 * La ventana libre de la duración pedida más cercana a la hora pedida en un día, o ninguna.
 * Así, a quien pidió 11:00 se le sugiere 13:00 antes que 07:00.
 */
function alternativaEnDia(
  dia: DiaDisponibilidad,
  duracion: number,
  horaPedida: string,
): AlternativaReserva | null {
  let mejor: AlternativaReserva | null = null;
  let menorDistancia = Infinity;
  for (let i = 0; i + duracion <= dia.franjas.length; i += 1) {
    const ventana = dia.franjas.slice(i, i + duracion);
    if (!ventana.every((franja) => franja.estado === 'disponible')) continue;
    const distancia = Math.abs(aMinutos(ventana[0].horaInicio) - aMinutos(horaPedida));
    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      mejor = {
        fecha: dia.fecha,
        horaInicio: ventana[0].horaInicio,
        horaFin: ventana[ventana.length - 1].horaFin,
      };
    }
  }
  return mejor;
}

/** Hasta 3 alternativas, una por día, en la semana que empieza en la fecha pedida (CA2). */
async function buscarAlternativas(
  datos: FormularioReserva,
  duracion: number,
): Promise<AlternativaReserva[]> {
  const dias = await obtenerDisponibilidad(datos.espacioId, datos.fecha, sumarDias(datos.fecha, 7));
  const alternativas: AlternativaReserva[] = [];
  for (const dia of dias) {
    const alternativa = alternativaEnDia(dia, duracion, datos.horaInicio);
    if (alternativa) alternativas.push(alternativa);
    if (alternativas.length === 3) break;
  }
  return alternativas;
}

/**
 * Solicita una reserva a nombre del usuario de la sesión (HU-18); queda pendiente.
 * Solo docentes y administrativos reservan (403 para los demás, #240). Valida formato,
 * asistentes (CA3), día hábil, anticipación y disponibilidad con la misma regla de HU-17. Si el
 * horario no está libre, lanza ErrorReserva con alternativas (CA2).
 */
export async function solicitarReserva(
  usuario: Usuario,
  datos: FormularioReserva,
): Promise<Reserva> {
  if (usaApi('espacios')) {
    // El solicitante sale del token. El Backend valida todo (anticipación, horario, tipo de
    // usuario); en un conflicto (409) trae tramos libres del mismo día.
    try {
      const creada = await peticion<ReservaBackend>('/spaces/reservations/', {
        method: 'POST',
        body: JSON.stringify(reservaHaciaBackend(datos)),
      });
      return reservaDesdeBackend(creada, { id: usuario.id, nombre: usuario.nombre });
    } catch (error) {
      if (error instanceof ErrorApi && error.codigo === 'SCHEDULE_CONFLICT') {
        const tramos =
          (error.cuerpo as { alternative_slots?: { start_time: string; end_time: string }[] })
            ?.alternative_slots ?? [];
        const duracion = aMinutos(datos.horaFin) - aMinutos(datos.horaInicio);
        throw new ErrorReserva(
          error.message,
          alternativasDesdeBackend(tramos, datos.fecha, duracion),
        );
      }
      throw error;
    }
  }
  if (!USAR_MOCKS) {
    return peticion<Reserva>('/reservas/', { method: 'POST', body: JSON.stringify(datos) });
  }

  if (!puedeReservarEspacios(usuario.tipo)) {
    throw new ErrorApi(403, MENSAJE_NO_RESERVA_ESPACIOS);
  }

  if (
    !esFechaValida(datos.fecha) ||
    !esHoraValida(datos.horaInicio) ||
    !esHoraValida(datos.horaFin)
  ) {
    throw new ErrorApi(400, 'Revisa la fecha y las horas de la reserva.');
  }

  const espacio = ESPACIOS.find((e) => e.id === datos.espacioId && e.activo);
  if (!espacio) {
    throw new ErrorApi(404, 'El espacio no existe o está inactivo.');
  }
  if (!datos.proposito?.trim()) {
    throw new ErrorApi(400, 'El propósito de la reserva es obligatorio.');
  }
  // La capacidad es orientativa: no limita la reserva (la biblioteca agrega sillas).
  if (!Number.isInteger(datos.asistentes) || datos.asistentes < 1) {
    throw new ErrorApi(400, 'Debe asistir al menos 1 persona.');
  }
  // El tipo de usuario sale de la sesión: decide qué datos académicos se exigen.
  const datosSolicitante = datos.datosSolicitante
    ? { ...datos.datosSolicitante, tipo: usuario.tipo }
    : undefined;
  const problemaCompleta = problemaSolicitudCompleta({ ...datos, datosSolicitante }, espacio);
  if (problemaCompleta) {
    throw new ErrorApi(400, problemaCompleta);
  }

  const parametros = await obtenerParametros();
  if (!esDiaHabil(datos.fecha, parametros)) {
    throw new ErrorApi(400, 'La fecha no es un día hábil de la biblioteca.');
  }

  if (datos.horaFin <= datos.horaInicio) {
    throw new ErrorApi(400, 'La hora de fin debe ser posterior a la de inicio.');
  }
  const duracion = duracionHoras(datos.horaInicio, datos.horaFin);
  if (!Number.isInteger(duracion)) {
    throw new ErrorApi(400, 'El horario debe ser de horas completas.');
  }

  const dias = await obtenerDisponibilidad(datos.espacioId, datos.fecha, datos.fecha);
  const franjas = dias[0]?.franjas ?? [];
  const pedidas = franjas.filter(
    (franja) => franja.horaInicio >= datos.horaInicio && franja.horaFin <= datos.horaFin,
  );
  const disponible =
    pedidas.length === duracion && pedidas.every((franja) => franja.estado === 'disponible');

  if (!disponible) {
    const alternativas = await buscarAlternativas(datos, duracion);
    throw new ErrorReserva('Ese horario no está disponible.', alternativas);
  }

  return simularRed(
    registrarSolicitudReserva({
      espacioId: datos.espacioId,
      solicitanteId: usuario.id,
      solicitante: usuario.nombre,
      fecha: datos.fecha,
      horaInicio: datos.horaInicio,
      horaFin: datos.horaFin,
      proposito: datos.proposito.trim(),
      asistentes: datos.asistentes,
      requerimientos: datos.requerimientos?.trim() || undefined,
      ...(datos.sede ? { sede: datos.sede } : {}),
      ...(datos.recursos ? { recursos: [...datos.recursos] } : {}),
      ...(datosSolicitante
        ? {
            datosSolicitante: aDatosSolicitante(valoresSolicitante(datosSolicitante)),
            terminosAceptados: true,
          }
        : {}),
    }),
  );
}

/**
 * Los campos de la versión 1.1 (#224), con las mismas reglas del formulario completo. Con
 * `datosSolicitante` llega la solicitud completa: pide la identificación (NIP), la sede y los
 * términos. Los asistentes no se comparan con la capacidad (es orientativa).
 */
function problemaSolicitudCompleta(datos: FormularioReserva, espacio: Espacio): string | null {
  if (datos.datosSolicitante) {
    const solicitante = problemaSolicitante(datos.datosSolicitante, { pedirIdentificacion: true });
    if (solicitante) return solicitante;
    if (datos.sede === undefined) return 'Elige la sede.';
    if (datos.terminosAceptados !== true) {
      return 'Acepta los términos y condiciones para enviar la solicitud.';
    }
  }
  if (datos.sede !== undefined) {
    const sede = problemaSede(datos.sede, espacio);
    if (sede) return sede;
  }
  if (datos.recursos) {
    const recursos = problemaRecursos(datos.recursos);
    if (recursos) return recursos;
  }
  if ((datos.requerimientos?.trim().length ?? 0) > LARGO_MAXIMO_NOVEDADES_RESERVA) {
    return `Las novedades no pueden pasar de ${LARGO_MAXIMO_NOVEDADES_RESERVA} caracteres.`;
  }
  return null;
}
