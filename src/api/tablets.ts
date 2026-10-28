/**
 * Inventario de tablets (HU-21), solicitud de préstamo (HU-22), entrega/devolución (HU-23)
 * y préstamos vencidos (HU-24).
 * Lista, crea, edita y cambia el estado operativo; muestra la disponibilidad por franja,
 * registra la solicitud, entrega y recibe los equipos, y marca y avisa los vencidos.
 * Las rutas son provisionales: confírmenlas con el equipo de Backend.
 */
import type {
  CondicionesTablet,
  CondicionTablet,
  EstadoFranja,
  EstadoPrestamo,
  EstadoTablet,
  HorarioAtencion,
  Parametros,
  Prestamo,
  RegistroTablet,
  Tablet,
  Usuario,
} from '@/types';
import { sumarDias } from '@/utils/calendario';
import { esFechaValida, esHoraValida, hoyISO } from '@/utils/fechas';
import { aHora, aMinutos } from '@/utils/franjas';
import { esDiaHabil, motivoNoDisponible } from '@/utils/parametros';
import {
  ahoraFechaHora,
  estadoTabletAlDevolver,
  estadoTabletAlEntregar,
  estaOperativa,
  minutosDeRetraso,
  tabletsLibresEnFranja,
} from '@/utils/tablets';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { CONDICIONES_TABLET, PRESTAMOS_TABLET, TABLETS } from './mocks/tablets';
import { USUARIOS_DIRECTORIO } from './mocks/usuarios';
import { crearNotificacion } from './notificaciones';
import { obtenerParametros } from './parametros';

/** Copias mutables: con mocks, lo que se crea, edita o presta se ve durante la sesión. */
let tablets: Tablet[] = TABLETS.map((tablet) => ({ ...tablet }));
let prestamos: Prestamo[] = PRESTAMOS_TABLET.map(copiarPrestamo);

/** Préstamos a los que ya se les creó la alerta y el aviso (HU-24, CA2). */
const avisosVencidos = new Set<string>();

const ESTADOS: readonly EstadoTablet[] = ['disponible', 'en_prestamo', 'mantenimiento', 'de_baja'];

/** Datos del formulario de una tablet; sin id crea y con id edita. */
export type DatosTablet = Omit<Tablet, 'id'> & { id?: string };

/** Validación de la HU-21: campos obligatorios y código/serial únicos (CA2). */
function errorDeValidacion(datos: DatosTablet): ErrorApi | null {
  if (!datos.codigo?.trim()) {
    return new ErrorApi(400, 'El código interno es obligatorio.');
  }
  if (!datos.serial?.trim()) {
    return new ErrorApi(400, 'El serial es obligatorio.');
  }
  if (!datos.modelo?.trim()) {
    return new ErrorApi(400, 'El modelo es obligatorio.');
  }
  if (!ESTADOS.includes(datos.estado)) {
    return new ErrorApi(400, 'El estado de la tablet no es válido.');
  }
  if (datos.accesorios.some((accesorio) => !accesorio.trim())) {
    return new ErrorApi(400, 'Los accesorios no pueden estar vacíos.');
  }
  const codigo = datos.codigo.trim().toLowerCase();
  const serial = datos.serial.trim().toLowerCase();
  const repetido = tablets.find(
    (tablet) =>
      tablet.id !== datos.id &&
      (tablet.codigo.toLowerCase() === codigo || tablet.serial.toLowerCase() === serial),
  );
  if (repetido) {
    return new ErrorApi(400, 'Ya existe una tablet con ese código o serial.');
  }
  return null;
}

export function obtenerTablets(): Promise<Tablet[]> {
  if (USAR_MOCKS) {
    return simularRed(tablets.map((tablet) => ({ ...tablet })));
  }
  return peticion<Tablet[]>('/tablets/');
}

export function crearTablet(datos: DatosTablet): Promise<Tablet> {
  if (USAR_MOCKS) {
    const error = errorDeValidacion(datos);
    if (error) {
      return Promise.reject(error);
    }
    const nueva: Tablet = {
      ...datos,
      id: `tab-${Date.now()}`,
      codigo: datos.codigo.trim(),
      serial: datos.serial.trim(),
      modelo: datos.modelo.trim(),
    };
    tablets = [...tablets, nueva];
    return simularRed({ ...nueva });
  }
  return peticion<Tablet>('/tablets/', { method: 'POST', body: JSON.stringify(datos) });
}

export function editarTablet(id: string, datos: DatosTablet): Promise<Tablet> {
  if (USAR_MOCKS) {
    const indice = tablets.findIndex((tablet) => tablet.id === id);
    if (indice === -1) {
      return Promise.reject(new ErrorApi(404, 'La tablet no existe.'));
    }
    const error = errorDeValidacion({ ...datos, id });
    if (error) {
      return Promise.reject(error);
    }
    const actualizada: Tablet = {
      ...datos,
      id,
      codigo: datos.codigo.trim(),
      serial: datos.serial.trim(),
      modelo: datos.modelo.trim(),
    };
    tablets = tablets.map((tablet, i) => (i === indice ? actualizada : tablet));
    return simularRed({ ...actualizada });
  }
  return peticion<Tablet>(`/tablets/${id}/`, { method: 'PUT', body: JSON.stringify(datos) });
}

/** Cambia el estado operativo (CA3): una tablet no operativa deja de estar disponible. */
export function cambiarEstadoTablet(id: string, estado: EstadoTablet): Promise<Tablet> {
  if (USAR_MOCKS) {
    const indice = tablets.findIndex((tablet) => tablet.id === id);
    if (indice === -1) {
      return Promise.reject(new ErrorApi(404, 'La tablet no existe.'));
    }
    if (!ESTADOS.includes(estado)) {
      return Promise.reject(new ErrorApi(400, 'El estado de la tablet no es válido.'));
    }
    tablets = tablets.map((tablet, i) => (i === indice ? { ...tablet, estado } : tablet));
    return simularRed({ ...tablets[indice] });
  }
  return peticion<Tablet>(`/tablets/${id}/estado/`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
}

// ── HU-23: entrega y devolución de préstamos ───────────────────

const CONDICIONES: readonly CondicionTablet[] = ['bueno', 'regular', 'danado'];

/** Datos de la entrega: condición física y accesorios entregados (CA1). */
export type DatosEntrega = Pick<RegistroTablet, 'condicion' | 'accesorios'>;

/** Datos de la devolución: condición, accesorios y novedades si hay daños o faltantes (CA3). */
export type DatosDevolucion = DatosEntrega & Pick<RegistroTablet, 'novedades'>;

/** Copia profunda de un préstamo para no exponer el almacén mutable. */
function copiarPrestamo(prestamo: Prestamo): Prestamo {
  return {
    ...prestamo,
    entrega: prestamo.entrega
      ? { ...prestamo.entrega, accesorios: [...prestamo.entrega.accesorios] }
      : undefined,
    devolucion: prestamo.devolucion
      ? { ...prestamo.devolucion, accesorios: [...prestamo.devolucion.accesorios] }
      : undefined,
  };
}

/** Validación de la condición y los accesorios de un registro (HU-23). */
function errorDeRegistro(datos: DatosEntrega): ErrorApi | null {
  if (!CONDICIONES.includes(datos.condicion)) {
    return new ErrorApi(400, 'La condición del equipo no es válida.');
  }
  if (datos.accesorios.some((accesorio) => !accesorio.trim())) {
    return new ErrorApi(400, 'Los accesorios no pueden estar vacíos.');
  }
  return null;
}

/** Préstamos, opcionalmente filtrados por estado (HU-23). */
export function obtenerPrestamos(
  estado: EstadoPrestamo | 'todas' = 'todas',
): Promise<Prestamo[]> {
  if (USAR_MOCKS) {
    const filtrados =
      estado === 'todas' ? prestamos : prestamos.filter((prestamo) => prestamo.estado === estado);
    return simularRed(filtrados.map(copiarPrestamo));
  }
  const consulta = estado === 'todas' ? '' : `?estado=${estado}`;
  return peticion<Prestamo[]>(`/prestamos/${consulta}`);
}

/**
 * Registra la entrega de un préstamo reservado (CA1): guarda fecha, hora, condición y
 * accesorios, y deja la tablet en préstamo.
 */
export function registrarEntrega(prestamoId: string, datos: DatosEntrega): Promise<Prestamo> {
  if (USAR_MOCKS) {
    const prestamo = prestamos.find((actual) => actual.id === prestamoId);
    if (!prestamo) {
      return Promise.reject(new ErrorApi(404, 'El préstamo no existe.'));
    }
    if (prestamo.estado !== 'reservado') {
      return Promise.reject(new ErrorApi(400, 'Solo se puede entregar un préstamo reservado.'));
    }
    if (!prestamo.condicionesAceptadas) {
      return Promise.reject(
        new ErrorApi(400, 'El préstamo no tiene las condiciones de uso aceptadas.'),
      );
    }
    const error = errorDeRegistro(datos);
    if (error) {
      return Promise.reject(error);
    }
    const tablet = tablets.find((actual) => actual.id === prestamo.tabletId);
    if (!tablet) {
      return Promise.reject(new ErrorApi(404, 'La tablet del préstamo no existe.'));
    }
    if (tablet.estado !== 'disponible') {
      return Promise.reject(new ErrorApi(400, 'La tablet no está disponible para entregar.'));
    }
    const entrega: RegistroTablet = {
      fechaHora: ahoraFechaHora(),
      condicion: datos.condicion,
      accesorios: datos.accesorios.map((accesorio) => accesorio.trim()),
    };
    prestamos = prestamos.map((actual) =>
      actual.id === prestamoId ? { ...actual, estado: 'entregado', entrega } : actual,
    );
    tablets = tablets.map((actual) =>
      actual.id === tablet.id ? { ...actual, estado: estadoTabletAlEntregar() } : actual,
    );
    const actualizado = prestamos.find((actual) => actual.id === prestamoId);
    if (!actualizado) {
      return Promise.reject(new ErrorApi(404, 'El préstamo no existe.'));
    }
    return simularRed(copiarPrestamo(actualizado));
  }
  return peticion<Prestamo>(`/prestamos/${prestamoId}/entrega/`, {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

/**
 * Registra la devolución de un préstamo entregado o vencido (CA2): cierra el préstamo,
 * guarda la novedad si hay daños o faltantes (CA3), marca el retraso (CA4) y deja la
 * tablet disponible o en mantenimiento si se dañó.
 */
export function registrarDevolucion(
  prestamoId: string,
  datos: DatosDevolucion,
): Promise<Prestamo> {
  if (USAR_MOCKS) {
    const prestamo = prestamos.find((actual) => actual.id === prestamoId);
    if (!prestamo) {
      return Promise.reject(new ErrorApi(404, 'El préstamo no existe.'));
    }
    if (prestamo.estado !== 'entregado' && prestamo.estado !== 'vencido') {
      return Promise.reject(new ErrorApi(400, 'Solo se puede devolver un préstamo entregado.'));
    }
    if (!prestamo.entrega) {
      return Promise.reject(new ErrorApi(400, 'El préstamo no tiene una entrega registrada.'));
    }
    const error = errorDeRegistro(datos);
    if (error) {
      return Promise.reject(error);
    }
    const tablet = tablets.find((actual) => actual.id === prestamo.tabletId);
    if (!tablet) {
      return Promise.reject(new ErrorApi(404, 'La tablet del préstamo no existe.'));
    }
    const entregados = new Set(prestamo.entrega.accesorios.map((accesorio) => accesorio.trim()));
    const devueltos = new Set(datos.accesorios.map((accesorio) => accesorio.trim()));
    const faltantes = [...entregados].filter((accesorio) => !devueltos.has(accesorio));
    const novedades = datos.novedades?.trim() ?? '';
    if ((datos.condicion === 'danado' || faltantes.length > 0) && !novedades) {
      return Promise.reject(
        new ErrorApi(400, 'Describe la novedad: hay daños o accesorios faltantes.'),
      );
    }
    const retrasoMinutos = minutosDeRetraso(prestamo);
    const devolucion: RegistroTablet = {
      fechaHora: ahoraFechaHora(),
      condicion: datos.condicion,
      accesorios: [...devueltos],
      ...(novedades ? { novedades } : {}),
      tardia: retrasoMinutos > 0,
      retrasoMinutos,
    };
    prestamos = prestamos.map((actual) =>
      actual.id === prestamoId ? { ...actual, estado: 'devuelto', devolucion } : actual,
    );
    tablets = tablets.map((actual) =>
      actual.id === tablet.id
        ? { ...actual, estado: estadoTabletAlDevolver(datos.condicion) }
        : actual,
    );
    const actualizado = prestamos.find((actual) => actual.id === prestamoId);
    if (!actualizado) {
      return Promise.reject(new ErrorApi(404, 'El préstamo no existe.'));
    }
    return simularRed(copiarPrestamo(actualizado));
  }
  return peticion<Prestamo>(`/prestamos/${prestamoId}/devolucion/`, {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

// ── HU-22: disponibilidad y solicitud de préstamo ──────────────

/** Una franja de 1 hora con las tablets libres (HU-22). No dice quién tiene las demás. */
export type FranjaTablets = {
  horaInicio: string;
  horaFin: string;
  estado: EstadoFranja;
  /** Tablets operativas sin préstamo activo en esta hora. */
  libres: number;
  /** Tablets operativas del inventario. */
  total: number;
  /** Por qué la franja no se puede solicitar. */
  motivo?: string;
};

/** Horario alternativo sugerido cuando no hay tablets libres (CA2). */
export type AlternativaPrestamo = {
  fecha: string;
  horaInicio: string;
  horaLimite: string;
};

/** Disponibilidad de tablets de un día (HU-22). */
export type DiaTablets = {
  fecha: string;
  habil: boolean;
  motivo?: string;
  franjas: FranjaTablets[];
  /** Solo cuando la fecha consultada no tiene ninguna franja disponible (CA2). */
  sugerencias: AlternativaPrestamo[];
};

/** Rango de horas completas del préstamo; puede cubrir varias franjas. */
export type FranjaPrestamo = {
  horaInicio: string;
  horaLimite: string;
};

/**
 * Lo que llena el usuario al solicitar una tablet (HU-22).
 * Quién solicita sale de la sesión, no del formulario.
 */
export type FormularioPrestamo = {
  fecha: string;
  franja: FranjaPrestamo;
  aceptaCondiciones: boolean;
};

/** Error 400 de la solicitud, con horarios alternativos (CA2). */
export class ErrorPrestamo extends ErrorApi {
  alternativas: AlternativaPrestamo[];

  constructor(mensaje: string, alternativas: AlternativaPrestamo[] = []) {
    super(400, mensaje);
    this.name = 'ErrorPrestamo';
    this.alternativas = alternativas;
  }
}

function duracionHoras(inicio: string, fin: string): number {
  return (aMinutos(fin) - aMinutos(inicio)) / 60;
}

function horarioDelDia(fecha: string, parametros: Parametros): HorarioAtencion | undefined {
  const dia = new Date(`${fecha}T00:00:00`).getDay();
  return parametros.horarios.find((horario) => horario.dia === dia);
}

/**
 * Franjas de 1 hora del horario de atención con las tablets libres. Es síncrona y no simula
 * red, para reutilizarla al buscar sugerencias y alternativas.
 */
function franjasDelDia(fecha: string, parametros: Parametros): FranjaTablets[] {
  const horario = horarioDelDia(fecha, parametros);
  if (!horario) return [];

  const total = tablets.filter(estaOperativa).length;
  const ahora = new Date();
  const minimo = new Date(ahora.getTime() + parametros.horasMinimasSolicitud * 60 * 60 * 1000);
  const franjas: FranjaTablets[] = [];

  for (let inicio = aMinutos(horario.abre); inicio + 60 <= aMinutos(horario.cierra); inicio += 60) {
    const horaInicio = aHora(inicio);
    const horaFin = aHora(inicio + 60);
    const libres = tabletsLibresEnFranja(tablets, prestamos, fecha, horaInicio, horaFin).length;
    const inicioFechaHora = new Date(`${fecha}T${horaInicio}:00`);
    let estado: EstadoFranja = 'disponible';
    let motivo: string | undefined;

    if (inicioFechaHora < ahora) {
      estado = 'no_disponible';
      motivo = 'Ya pasó';
    } else if (inicioFechaHora < minimo) {
      estado = 'no_disponible';
      motivo = `Faltan menos de ${parametros.horasMinimasSolicitud} h para solicitarla`;
    } else if (total === 0) {
      estado = 'no_disponible';
      motivo = 'No hay tablets operativas.';
    } else if (libres === 0) {
      estado = 'reservada';
      motivo = 'No quedan tablets libres en esta franja.';
    }

    franjas.push({ horaInicio, horaFin, estado, libres, total, ...(motivo ? { motivo } : {}) });
  }
  return franjas;
}

/** Hasta 3 franjas de 1 hora disponibles desde la fecha (o hoy) y los 7 días siguientes. */
function buscarSugerencias(fecha: string, parametros: Parametros): AlternativaPrestamo[] {
  const hoy = hoyISO();
  const desde = fecha > hoy ? fecha : hoy;
  const sugerencias: AlternativaPrestamo[] = [];
  for (let i = 0; i <= 7 && sugerencias.length < 3; i += 1) {
    const dia = sumarDias(desde, i);
    if (!esDiaHabil(dia, parametros)) continue;
    for (const franja of franjasDelDia(dia, parametros)) {
      if (franja.estado !== 'disponible') continue;
      sugerencias.push({ fecha: dia, horaInicio: franja.horaInicio, horaLimite: franja.horaFin });
      if (sugerencias.length === 3) break;
    }
  }
  return sugerencias;
}

/**
 * La ventana libre de la duración pedida más cercana a la hora pedida en un día, o ninguna.
 * Además de que cada hora tenga tablets libres, una misma tablet debe estar libre toda la
 * ventana; si no, la sugerencia fallaría al confirmarla.
 */
function alternativaEnDia(
  fecha: string,
  parametros: Parametros,
  duracion: number,
  horaPedida: string,
): AlternativaPrestamo | null {
  const franjas = franjasDelDia(fecha, parametros);
  let mejor: AlternativaPrestamo | null = null;
  let menorDistancia = Infinity;
  for (let i = 0; i + duracion <= franjas.length; i += 1) {
    const ventana = franjas.slice(i, i + duracion);
    if (!ventana.every((franja) => franja.estado === 'disponible')) continue;
    const horaInicio = ventana[0].horaInicio;
    const horaLimite = ventana[ventana.length - 1].horaFin;
    if (tabletsLibresEnFranja(tablets, prestamos, fecha, horaInicio, horaLimite).length === 0) {
      continue;
    }
    const distancia = Math.abs(aMinutos(horaInicio) - aMinutos(horaPedida));
    if (distancia < menorDistancia) {
      menorDistancia = distancia;
      mejor = { fecha, horaInicio, horaLimite };
    }
  }
  return mejor;
}

/** Hasta 3 alternativas de la misma duración, una por día, desde la fecha pedida (CA2). */
function buscarAlternativas(
  fecha: string,
  horaInicio: string,
  horaLimite: string,
  parametros: Parametros,
): AlternativaPrestamo[] {
  const duracion = duracionHoras(horaInicio, horaLimite);
  const alternativas: AlternativaPrestamo[] = [];
  for (let i = 0; i <= 7 && alternativas.length < 3; i += 1) {
    const dia = sumarDias(fecha, i);
    if (!esDiaHabil(dia, parametros)) continue;
    const alternativa = alternativaEnDia(dia, parametros, duracion, horaInicio);
    if (alternativa) alternativas.push(alternativa);
  }
  return alternativas;
}

function ordenarPrestamos(lista: Prestamo[]): Prestamo[] {
  return [...lista].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio),
  );
}

/**
 * Franjas de 1 hora del día con las tablets libres (HU-22). Respeta día hábil, horario de
 * atención y anticipación mínima. Si no queda ninguna franja disponible, sugiere otras (CA2).
 */
export async function obtenerDisponibilidadTablets(fecha: string): Promise<DiaTablets> {
  if (!esFechaValida(fecha)) {
    throw new ErrorApi(400, 'La fecha no es válida.');
  }
  if (!USAR_MOCKS) {
    // Ruta provisional: confirmar con Backend.
    return peticion<DiaTablets>(`/tablets/disponibilidad/?fecha=${fecha}`);
  }

  const parametros = await obtenerParametros();
  if (!esDiaHabil(fecha, parametros)) {
    return simularRed({
      fecha,
      habil: false,
      motivo: motivoNoDisponible(fecha, parametros) ?? undefined,
      franjas: [],
      sugerencias: buscarSugerencias(fecha, parametros),
    });
  }

  const franjas = franjasDelDia(fecha, parametros);
  const sugerencias = franjas.some((franja) => franja.estado === 'disponible')
    ? []
    : buscarSugerencias(fecha, parametros);
  return simularRed({ fecha, habil: true, franjas, sugerencias });
}

/** Condiciones de uso del préstamo (HU-22, CA3). Texto provisional de la biblioteca. */
export function obtenerCondicionesTablet(): Promise<CondicionesTablet> {
  if (USAR_MOCKS) {
    return simularRed({ ...CONDICIONES_TABLET });
  }
  return peticion<CondicionesTablet>('/tablets/condiciones/');
}

/**
 * Solicita una tablet a nombre del usuario de la sesión (HU-22). Exige aceptar las
 * condiciones (CA3); si no hay tablets libres en la franja, lanza ErrorPrestamo con
 * alternativas (CA2). El préstamo queda reservado y se notifica (CA1). La tablet no cambia
 * de estado hasta que se entregue (HU-23).
 */
export async function solicitarPrestamo(
  usuario: Usuario,
  datos: FormularioPrestamo,
): Promise<Prestamo> {
  if (!USAR_MOCKS) {
    // Ruta provisional: confirmar con Backend. El solicitante sale del token.
    return peticion<Prestamo>('/prestamos/', { method: 'POST', body: JSON.stringify(datos) });
  }

  if (!datos.aceptaCondiciones) {
    throw new ErrorApi(400, 'Debes aceptar las condiciones de uso para solicitar la tablet.');
  }

  const { fecha } = datos;
  const { horaInicio, horaLimite } = datos.franja;
  if (!esFechaValida(fecha) || !esHoraValida(horaInicio) || !esHoraValida(horaLimite)) {
    throw new ErrorApi(400, 'Revisa la fecha y las horas del préstamo.');
  }
  if (horaLimite <= horaInicio) {
    throw new ErrorApi(400, 'La hora límite debe ser posterior a la de inicio.');
  }
  if (!horaInicio.endsWith(':00') || !horaLimite.endsWith(':00')) {
    throw new ErrorApi(400, 'Usa horas en punto, por ejemplo 09:00.');
  }

  const parametros = await obtenerParametros();
  const horario = horarioDelDia(fecha, parametros);
  if (!esDiaHabil(fecha, parametros) || !horario) {
    throw new ErrorApi(400, 'La fecha no es un día hábil de la biblioteca.');
  }
  if (horaInicio < horario.abre || horaLimite > horario.cierra) {
    throw new ErrorApi(400, 'La franja está fuera del horario de atención.');
  }
  const minimo = Date.now() + parametros.horasMinimasSolicitud * 60 * 60 * 1000;
  if (new Date(`${fecha}T${horaInicio}:00`).getTime() < minimo) {
    throw new ErrorApi(
      400,
      `La franja no cumple la anticipación mínima de ${parametros.horasMinimasSolicitud} horas.`,
    );
  }

  // Primero las que hoy están disponibles: HU-23 solo entrega una tablet disponible.
  const libres = tabletsLibresEnFranja(tablets, prestamos, fecha, horaInicio, horaLimite).sort(
    (a, b) =>
      Number(b.estado === 'disponible') - Number(a.estado === 'disponible') ||
      a.codigo.localeCompare(b.codigo),
  );
  if (libres.length === 0) {
    const alternativas = buscarAlternativas(fecha, horaInicio, horaLimite, parametros);
    throw new ErrorPrestamo('No hay tablets libres en esa franja.', alternativas);
  }

  const nuevo: Prestamo = {
    id: `pre-${Date.now()}-${prestamos.length + 1}`,
    tabletId: libres[0].id,
    solicitanteId: usuario.id,
    solicitante: usuario.nombre,
    fecha,
    horaInicio,
    horaLimite,
    condicionesAceptadas: true,
    estado: 'reservado',
  };
  prestamos = [...prestamos, nuevo];

  crearNotificacion({
    usuarioId: usuario.id,
    solicitudId: nuevo.id,
    titulo: 'Préstamo de tablet reservado',
    mensaje: `Reservamos una tablet para el ${fecha} de ${horaInicio} a ${horaLimite}. Recógela en la biblioteca.`,
  });

  return simularRed(copiarPrestamo(nuevo));
}

/** Préstamos del usuario de la sesión, por fecha y hora, en todos sus estados (HU-22 y HU-30). */
export function obtenerMisPrestamos(usuarioId: string): Promise<Prestamo[]> {
  if (USAR_MOCKS) {
    const mios = prestamos.filter((prestamo) => prestamo.solicitanteId === usuarioId);
    return simularRed(ordenarPrestamos(mios).map(copiarPrestamo));
  }
  // Ruta provisional: confirmar con Backend. El usuario sale del token.
  return peticion<Prestamo[]>('/prestamos/mios/');
}

// ── HU-24: préstamos vencidos ──────────────────────────────────

/** Por hora límite, el más antiguo primero. */
function ordenarVencidos(lista: Prestamo[]): Prestamo[] {
  return [...lista].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || a.horaLimite.localeCompare(b.horaLimite),
  );
}

/**
 * Alerta a los encargados de tablets y avisa al usuario, una sola vez por préstamo (CA2).
 * Si no hay encargados en el directorio, el aviso al usuario se crea igual.
 */
function avisarVencido(prestamo: Prestamo): void {
  if (avisosVencidos.has(prestamo.id)) return;

  const tablet = tablets.find((actual) => actual.id === prestamo.tabletId);
  const codigo = tablet?.codigo ?? 'sin código';
  const encargados = USUARIOS_DIRECTORIO.filter((usuario) =>
    usuario.rolesPersonal.includes('encargado_tablets'),
  );

  for (const encargado of encargados) {
    crearNotificacion({
      usuarioId: encargado.id,
      solicitudId: prestamo.id,
      titulo: 'Préstamo vencido',
      mensaje: `El préstamo de ${prestamo.solicitante} venció el ${prestamo.fecha} a las ${prestamo.horaLimite}. Tablet ${codigo}.`,
    });
  }
  crearNotificacion({
    usuarioId: prestamo.solicitanteId,
    solicitudId: prestamo.id,
    titulo: 'Recordatorio: devuelve la tablet',
    mensaje: `La tablet ${codigo} debía devolverse el ${prestamo.fecha} a las ${prestamo.horaLimite}. Devuélvela cuanto antes en la biblioteca.`,
  });
  avisosVencidos.add(prestamo.id);
}

/**
 * Préstamos vencidos (HU-24). Con mocks, marca `vencido` los entregados cuya hora límite ya
 * pasó (CA1) y avisa cada uno una sola vez (CA2); sin vencidos, devuelve [] (CA3).
 * Un préstamo reservado que nunca se entregó no es vencido. La tablet sigue en préstamo
 * hasta que se reciba (HU-23).
 */
export function obtenerPrestamosVencidos(): Promise<Prestamo[]> {
  if (!USAR_MOCKS) {
    // Ruta provisional: confirmar con Backend. El Backend marca y avisa; la app solo lee.
    return peticion<Prestamo[]>('/prestamos/vencidos/');
  }

  const ahora = new Date();
  prestamos = prestamos.map((prestamo) =>
    prestamo.estado === 'entregado' && minutosDeRetraso(prestamo, ahora) > 0
      ? { ...prestamo, estado: 'vencido' }
      : prestamo,
  );
  const vencidos = prestamos.filter((prestamo) => prestamo.estado === 'vencido');
  vencidos.forEach(avisarVencido);
  return simularRed(ordenarVencidos(vencidos).map(copiarPrestamo));
}
