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
  DatosSolicitante,
  EstadoEquipo,
  EstadoFranja,
  EstadoPrestamo,
  EstadoTablet,
  HorarioAtencion,
  Parametros,
  Prestamo,
  RegistroTablet,
  FirmaElectronica,
  ResponsableTablet,
  Tablet,
  Usuario,
} from '@/types';
import { sumarDias } from '@/utils/calendario';
import { esFechaValida, esHoraValida, hoyISO } from '@/utils/fechas';
import { aHora, aMinutos } from '@/utils/franjas';
import { horasEntreFechasHoras } from '@/utils/estadisticas';
import { esDiaHabil, motivoNoDisponible } from '@/utils/parametros';
import { constanciaDe, esFirmaValida, type ConstanciaPrestamo } from '@/utils/prestamos';
import { MENSAJE_NO_PIDE_TABLET, puedePedirTablet, tienePermiso } from '@/utils/roles';
import { aDatosSolicitante, problemaSolicitante, valoresSolicitante } from '@/utils/solicitante';
import { normalizarTexto } from '@/utils/texto';
import {
  ahoraFechaHora,
  asignarTabletAlEntregar,
  estadoTabletAlDevolver,
  estadoTabletAlEntregar,
  esInicioTablet,
  estaOperativa,
  horaLimiteDe,
  horasPorDefecto,
  horasPosibles,
  mensajeDiasMaximosTablet,
  MINUTOS_ENTRE_INICIOS_TABLET,
  minutosDeRetraso,
  noSeRecogio,
  prestamoOcupaFranja,
  problemaHoras,
  tabletsLibresEnFranja,
  ultimoDiaTablet,
} from '@/utils/tablets';

import { useSesion } from '@/store/sesion';

import {
  alternativasTabletDesdeBackend,
  franjasTabletsDesdeBackend,
  prestamoDesdeBackend,
  prestamoHaciaBackend,
  type DisponibilidadTabletsBackend,
  type PrestamoBackend,
} from './backend/tablets';
import { ErrorApi, peticion, peticionTodas, simularRed, usaApi, USAR_MOCKS } from './cliente';
import { CONDICIONES_TABLET, PRESTAMOS_TABLET, TABLETS } from './mocks/tablets';
import { USUARIOS_DIRECTORIO } from './mocks/usuarios';
import { firmaEnDirectorio } from './usuarios';
import { datosDeSolicitante, registrarUso } from './estadisticas';
import { estadoDePrestamo, registrarEvento } from './historial';
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

/** Estados del equipo como los nombra el formato de constancia (versión 1.1). */
const ESTADOS_EQUIPO: readonly EstadoEquipo[] = ['nuevo', 'optimo', 'otro'];

/**
 * Datos de la entrega (CA1 y versión 1.1, #252): condición física, accesorios entregados,
 * estado del equipo como lo nombra el formato y las notas.
 */
export type DatosEntrega = Pick<RegistroTablet, 'condicion' | 'accesorios'> & {
  /**
   * La tablet que se entrega, elegida o leída con el escáner (#310). Sin ella, la provisional
   * que se apartó al pedir el préstamo.
   */
  tabletId?: string;
  /** Nuevo, óptimo u otro. Con «otro», las notas son obligatorias (CA2). */
  estadoEquipo?: EstadoEquipo;
  notas?: string;
  /** La firma del usuario responsable en la pantalla (#310); sin ella, firma en papel. */
  firmaUsuario?: FirmaElectronica;
};

/** Datos de la devolución: condición, accesorios y novedades si hay daños o faltantes (CA3). */
export type DatosDevolucion = Pick<RegistroTablet, 'condicion' | 'accesorios' | 'novedades'>;

/** Quién hace el registro: la persona de la sesión, con su cargo (versión 1.1, #252). */
function responsableDe(usuario: Usuario): ResponsableTablet {
  return { id: usuario.id, nombre: usuario.nombre, cargo: usuario.cargo };
}

/**
 * Completa la firma de quien entregó o recibió con la que tiene registrada en su Perfil, si el
 * registro no la trae (revisión de la 1.1): por ejemplo, si registró su firma después de entregar.
 * No cambia el préstamo guardado; solo lo que muestra la constancia.
 */
function conFirmasRegistradas(prestamo: Prestamo): Prestamo {
  const completar = (registro: RegistroTablet | undefined): RegistroTablet | undefined => {
    if (!registro?.responsable || registro.firmaResponsable) return registro;
    const firma = firmaEnDirectorio(registro.responsable.id);
    return firma ? { ...registro, firmaResponsable: { ...firma } } : registro;
  };
  return {
    ...prestamo,
    entrega: completar(prestamo.entrega),
    devolucion: completar(prestamo.devolucion),
  };
}

/**
 * La firma registrada de quien entrega o recibe (revisión de la 1.1): la del directorio, que es la
 * más reciente, o la de la sesión. Sin firma registrada, firma con su sesión.
 */
function firmaDeResponsable(usuario: Usuario): Pick<RegistroTablet, 'firmaResponsable'> {
  const firma = firmaEnDirectorio(usuario.id) ?? usuario.firma;
  return firma ? { firmaResponsable: { ...firma } } : {};
}

/** El estado del equipo en el formato exige notas cuando es «otro» (CA2). */
function errorDeEstadoEquipo(datos: DatosEntrega): ErrorApi | null {
  if (datos.estadoEquipo == null) return null;
  if (!ESTADOS_EQUIPO.includes(datos.estadoEquipo)) {
    return new ErrorApi(400, 'El estado del equipo no es válido: nuevo, óptimo u otro.');
  }
  if (datos.estadoEquipo === 'otro' && !datos.notas?.trim()) {
    return new ErrorApi(400, 'Si el estado es «Otro», explica en las notas cuál es.');
  }
  return null;
}

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

/** Validación de la condición y los accesorios de un registro (HU-23), y de la firma (#310). */
function errorDeRegistro(datos: DatosEntrega): ErrorApi | null {
  if (!CONDICIONES.includes(datos.condicion)) {
    return new ErrorApi(400, 'La condición del equipo no es válida.');
  }
  if (datos.firmaUsuario && !esFirmaValida(datos.firmaUsuario)) {
    return new ErrorApi(400, 'La firma no es válida: vuelve a firmar.');
  }
  if (datos.accesorios.some((accesorio) => !accesorio.trim())) {
    return new ErrorApi(400, 'Los accesorios no pueden estar vacíos.');
  }
  return null;
}

/**
 * La constancia del préstamo, en el orden del formato de la biblioteca (#252, CA1).
 * La pantalla la muestra y la comparte; aquí solo se arma con los datos que ya existen.
 */
export function obtenerConstancia(prestamoId: string): Promise<ConstanciaPrestamo> {
  if (USAR_MOCKS) {
    const prestamo = prestamos.find((actual) => actual.id === prestamoId);
    if (!prestamo) {
      return Promise.reject(new ErrorApi(404, 'El préstamo no existe.'));
    }
    const tablet = tablets.find((actual) => actual.id === prestamo.tabletId);
    if (!tablet) {
      return Promise.reject(new ErrorApi(404, 'La tablet del préstamo no existe.'));
    }
    return simularRed(constanciaDe(conFirmasRegistradas(prestamo), tablet));
  }
  return peticion<ConstanciaPrestamo>(`/prestamos/${prestamoId}/constancia/`);
}

/** Préstamos, opcionalmente filtrados por estado (HU-23). */
export function obtenerPrestamos(
  estado: EstadoPrestamo | 'todas' = 'todas',
): Promise<Prestamo[]> {
  if (USAR_MOCKS) {
    liberarNoRecogidos();
    const filtrados =
      estado === 'todas' ? prestamos : prestamos.filter((prestamo) => prestamo.estado === estado);
    return simularRed(filtrados.map(copiarPrestamo));
  }
  const consulta = estado === 'todas' ? '' : `?estado=${estado}`;
  return peticion<Prestamo[]>(`/prestamos/${consulta}`);
}

/**
 * Busca una tablet por su código de barras o su código interno (HU-31, CA1 y CA2).
 * Acepta el código tal como lo lee el escáner (`TAB-001`, `tab001`, con espacios) y devuelve
 * la tablet del inventario. Si no corresponde a ninguna, rechaza con 404 para que la UI lo
 * indique y no registre nada (CA2).
 */
export function buscarTabletPorCodigo(codigo: string): Promise<Tablet> {
  if (USAR_MOCKS) {
    // Sin distinguir mayúsculas, tildes, guiones ni espacios: el escáner no siempre lee igual.
    const buscado = normalizarTexto(codigo ?? '').replace(/[\s-]/g, '');
    if (!buscado) {
      return Promise.reject(new ErrorApi(400, 'Escanea o escribe el código de la tablet.'));
    }
    const tablet = tablets.find(
      (actual) => normalizarTexto(actual.codigo).replace(/[\s-]/g, '') === buscado,
    );
    if (!tablet) {
      return Promise.reject(new ErrorApi(404, 'Ese código no corresponde a ninguna tablet.'));
    }
    return simularRed({ ...tablet });
  }
  return peticion<Tablet>(`/tablets/codigo/${encodeURIComponent(codigo)}/`);
}

/**
 * Registra la entrega de un préstamo reservado (CA1): guarda fecha, hora, condición y
 * accesorios, y deja la tablet en préstamo.
 */
export function registrarEntrega(
  usuario: Usuario,
  prestamoId: string,
  datos: DatosEntrega,
): Promise<Prestamo> {
  const sinEstado = errorDeEstadoEquipo(datos);
  if (sinEstado) {
    return Promise.reject(sinEstado);
  }
  if (USAR_MOCKS) {
    liberarNoRecogidos();
    const prestamo = prestamos.find((actual) => actual.id === prestamoId);
    if (!prestamo) {
      return Promise.reject(new ErrorApi(404, 'El préstamo no existe.'));
    }
    if (prestamo.estado === 'cancelado') {
      return Promise.reject(
        new ErrorApi(400, 'El préstamo se canceló porque no se recogió a tiempo.'),
      );
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
    // #310: la tablet se asigna al entregar; la de la solicitud era provisional.
    const asignacion = asignarTabletAlEntregar(
      tablets,
      prestamos,
      prestamo,
      datos.tabletId ?? prestamo.tabletId,
    );
    if ('problema' in asignacion) {
      return Promise.reject(new ErrorApi(400, asignacion.problema));
    }
    const { tablet, intercambio } = asignacion;
    const notas = datos.notas?.trim();
    const entrega: RegistroTablet = {
      fechaHora: ahoraFechaHora(),
      condicion: datos.condicion,
      accesorios: datos.accesorios.map((accesorio) => accesorio.trim()),
      // Versión 1.1 (#252): la constancia necesita quién entregó y en qué estado.
      ...(notas ? { novedades: notas } : {}),
      responsable: responsableDe(usuario),
      ...firmaDeResponsable(usuario),
      ...(datos.firmaUsuario ? { firmaUsuario: { ...datos.firmaUsuario } } : {}),
    };
    prestamos = prestamos.map((actual) =>
      actual.id === prestamoId
        ? {
            ...actual,
            tabletId: tablet.id,
            estado: 'entregado',
            entrega,
            estadoEquipo: datos.estadoEquipo ?? actual.estadoEquipo,
            notas: notas ?? actual.notas,
          }
        : actual,
    );
    // El otro préstamo apartado que tenía esta tablet se queda con la provisional de este.
    if (intercambio) {
      prestamos = prestamos.map((actual) =>
        actual.id === intercambio.prestamoId
          ? { ...actual, tabletId: intercambio.tabletId }
          : actual,
      );
    }
    tablets = tablets.map((actual) =>
      actual.id === tablet.id ? { ...actual, estado: estadoTabletAlEntregar() } : actual,
    );
    const actualizado = prestamos.find((actual) => actual.id === prestamoId);
    if (!actualizado) {
      return Promise.reject(new ErrorApi(404, 'El préstamo no existe.'));
    }
    registrarEvento(
      'prestamo',
      actualizado.id,
      estadoDePrestamo(actualizado.estado),
      'Personal de la biblioteca',
      `Tablet entregada. Devuélvela antes de las ${actualizado.horaLimite}.`,
    );
    // HU-25: la entrega deja su registro de uso (el préstamo queda activo).
    registrarUso({
      id: `uso-prestamo-${actualizado.id}`,
      servicio: 'tablets',
      finalidad: `Préstamo de ${tablet.modelo}`,
      fecha: actualizado.fecha,
      fechaFin: actualizado.fecha,
      modalidad: 'presencial',
      estado: 'pendiente',
      ...datosDeSolicitante(actualizado.solicitanteId),
    });
    return simularRed(copiarPrestamo(actualizado));
  }
  return peticion<Prestamo>(`/prestamos/${prestamoId}/entrega/`, {
    method: 'POST',
    body: JSON.stringify({ ...datos, responsableId: usuario.id }),
  });
}

/**
 * Registra la devolución de un préstamo entregado o vencido (CA2): cierra el préstamo,
 * guarda la novedad si hay daños o faltantes (CA3), marca el retraso (CA4) y deja la
 * tablet disponible o en mantenimiento si se dañó.
 */
export function registrarDevolucion(
  usuario: Usuario,
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
      // Versión 1.1 (#252): quién recibe la tablet, con su cargo.
      responsable: responsableDe(usuario),
      ...firmaDeResponsable(usuario),
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
    const condicion = datos.condicion === 'danado' ? 'dañado' : datos.condicion;
    registrarEvento(
      'prestamo',
      actualizado.id,
      estadoDePrestamo(actualizado.estado),
      'Personal de la biblioteca',
      `Tablet devuelta en estado ${condicion}${
        retrasoMinutos > 0 ? `, ${retrasoMinutos} min tarde` : ''
      }.${novedades ? ` Novedad: ${novedades}` : ''}`,
    );
    // HU-25: el préstamo devuelto deja su registro de uso.
    registrarUso({
      id: `uso-prestamo-${actualizado.id}`,
      servicio: 'tablets',
      finalidad: `Préstamo de ${tablet.modelo}`,
      fecha: actualizado.fecha,
      fechaFin: actualizado.fecha,
      modalidad: 'presencial',
      estado: 'completada',
      // #307: la duración real, de la entrega a la devolución, para la pestaña Tablets.
      duracionHoras:
        horasEntreFechasHoras(actualizado.entrega?.fechaHora, actualizado.devolucion?.fechaHora) ??
        undefined,
      ...datosDeSolicitante(actualizado.solicitanteId),
    });
    return simularRed(copiarPrestamo(actualizado));
  }
  return peticion<Prestamo>(`/prestamos/${prestamoId}/devolucion/`, {
    method: 'POST',
    body: JSON.stringify({ ...datos, responsableId: usuario.id }),
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
 * Lo que llena el usuario al solicitar una tablet (HU-22 y #163).
 * Quién solicita sale de la sesión, no del formulario. La hora límite la calcula la API con la
 * hora de inicio y las horas: no se confía en la que pudiera mandar la pantalla.
 */
export type FormularioPrestamo = {
  fecha: string;
  /** 'HH:MM', en punto o y media (MINUTOS_ENTRE_INICIOS_TABLET). */
  horaInicio: string;
  /**
   * De 1 a Parametros.horasMaximasPrestamo. Sin ella, Parametros.horasPrestamoTablet, como el
   * `tablet-loan-hours` del Backend (#278).
   */
  horas?: number;
  aceptaCondiciones: boolean;
  /** «Acepto la responsabilidad sobre el préstamo» (NOTAS_PRESTAMO). */
  responsabilidadAceptada: boolean;
  /** Con las reglas de #224 (utils/solicitante) y la identificación obligatoria. */
  datosSolicitante: DatosSolicitante;
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
 * Franjas del horario de atención con las tablets libres: empiezan cada 30 minutos
 * (MINUTOS_ENTRE_INICIOS_TABLET) y cada una dura 1 hora, la duración mínima. Es síncrona y no
 * simula red, para reutilizarla al buscar sugerencias y alternativas.
 */
function franjasDelDia(fecha: string, parametros: Parametros): FranjaTablets[] {
  const horario = horarioDelDia(fecha, parametros);
  if (!horario) return [];

  const total = tablets.filter(estaOperativa).length;
  const ahora = new Date();
  // #310: la tablet no tiene anticipación mínima (los 3 días de `horasMinimasSolicitud` son de
  // espacios, asesorías y capacitaciones): se aparta desde la app hasta que empieza la franja.
  const franjas: FranjaTablets[] = [];

  for (
    let inicio = aMinutos(horario.abre);
    inicio + 60 <= aMinutos(horario.cierra);
    inicio += MINUTOS_ENTRE_INICIOS_TABLET
  ) {
    const horaInicio = aHora(inicio);
    const horaFin = aHora(inicio + 60);
    const libres = tabletsLibresEnFranja(tablets, prestamos, fecha, horaInicio, horaFin).length;
    const inicioFechaHora = new Date(`${fecha}T${horaInicio}:00`);
    let estado: EstadoFranja = 'disponible';
    let motivo: string | undefined;

    if (inicioFechaHora < ahora) {
      estado = 'no_disponible';
      motivo = 'Ya pasó';
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

/**
 * Hasta 3 franjas de 1 hora disponibles desde la fecha (o hoy), sin pasar del último día en que
 * se puede apartar una tablet (diasMaximosTablet, #278).
 */
function buscarSugerencias(fecha: string, parametros: Parametros): AlternativaPrestamo[] {
  const hoy = hoyISO();
  const desde = fecha > hoy ? fecha : hoy;
  const ultimo = ultimoDiaTablet(parametros, hoy);
  const sugerencias: AlternativaPrestamo[] = [];
  for (let dia = desde; dia <= ultimo && sugerencias.length < 3; dia = sumarDias(dia, 1)) {
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
 * Empieza en una franja disponible (ya cumple la anticipación), no pasa del cierre y una misma
 * tablet está libre toda la ventana; si no, la sugerencia fallaría al confirmarla.
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
  for (const franja of franjas) {
    if (franja.estado !== 'disponible') continue;
    const { horaInicio } = franja;
    if (horasPosibles(franjas, horaInicio, duracion) < duracion) continue;
    const horaLimite = horaLimiteDe(horaInicio, duracion);
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

/**
 * Hasta 3 alternativas de la misma duración, una por día, desde la fecha pedida y sin pasar
 * del último día en que se puede apartar una tablet (CA2 y #278).
 */
function buscarAlternativas(
  fecha: string,
  horaInicio: string,
  horaLimite: string,
  parametros: Parametros,
): AlternativaPrestamo[] {
  const duracion = duracionHoras(horaInicio, horaLimite);
  const ultimo = ultimoDiaTablet(parametros, hoyISO());
  const alternativas: AlternativaPrestamo[] = [];
  for (let dia = fecha; dia <= ultimo && alternativas.length < 3; dia = sumarDias(dia, 1)) {
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
 * Franjas del día con las tablets libres, cada 30 minutos (HU-22 y #163). Respeta día hábil,
 * horario de atención y anticipación mínima. Si no queda ninguna franja disponible, sugiere
 * otras (CA2).
 */
export async function obtenerDisponibilidadTablets(fecha: string): Promise<DiaTablets> {
  if (!usaApi('tablets') && USAR_MOCKS) liberarNoRecogidos();
  if (!esFechaValida(fecha)) {
    throw new ErrorApi(400, 'La fecha no es válida.');
  }
  if (usaApi('tablets')) {
    // Pide sesión. Sin franjas, la Biblioteca no presta ese día: el motivo sale de los parámetros.
    const [dia, parametros] = await Promise.all([
      peticion<DisponibilidadTabletsBackend>(
        `/tablets/availability/?date=${encodeURIComponent(fecha)}&hours=1`,
      ),
      obtenerParametros(),
    ]);
    if (dia.slots.length === 0) {
      return {
        fecha,
        habil: false,
        motivo: motivoNoDisponible(fecha, parametros) ?? dia.message ?? undefined,
        franjas: [],
        sugerencias: [],
      };
    }
    return { fecha, habil: true, franjas: franjasTabletsDesdeBackend(dia), sugerencias: [] };
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
export async function obtenerCondicionesTablet(): Promise<CondicionesTablet> {
  if (usaApi('tablets')) {
    // La página `condiciones-tablets` del portal; mientras la biblioteca no la publica responde
    // 404 y se muestran las condiciones de siempre.
    try {
      const pagina = await peticion<{ title: string; body: string; published_at: string | null }>(
        '/portal/contents/condiciones-tablets/',
      );
      return {
        titulo: pagina.title,
        texto: pagina.body,
        actualizada: (pagina.published_at ?? CONDICIONES_TABLET.actualizada).slice(0, 10),
      };
    } catch (error) {
      if (error instanceof ErrorApi && error.estado === 404) return { ...CONDICIONES_TABLET };
      throw error;
    }
  }
  if (USAR_MOCKS) {
    return simularRed({ ...CONDICIONES_TABLET });
  }
  return peticion<CondicionesTablet>('/tablets/condiciones/');
}

/**
 * Solicita una tablet a nombre del usuario de la sesión (HU-22). Los egresados no pueden
 * (403, #240). Exige aceptar las condiciones (CA3) y la responsabilidad (#163). Empieza en punto
 * o y media, con hasta diasMaximosTablet días de anticipación (#278). Calcula la hora límite con
 * las horas pedidas (de 1 al máximo de los parámetros; sin ellas, horasPrestamoTablet) y exige
 * que una misma tablet esté libre todas esas horas; si no, lanza ErrorPrestamo con alternativas
 * de la misma duración (CA2). El préstamo queda reservado y se notifica (CA1). La tablet no
 * cambia de estado hasta que se entregue (HU-23).
 */
export async function solicitarPrestamo(
  usuario: Usuario,
  datos: FormularioPrestamo,
): Promise<Prestamo> {
  if (usaApi('tablets')) {
    // El solicitante sale del token. El Backend valida el horario, las horas y los 7 días; si no
    // hay tablet libre (409), trae los siguientes horarios con tablets.
    const parametros = await obtenerParametros();
    const horas = datos.horas ?? horasPorDefecto(parametros);
    try {
      const creado = await peticion<PrestamoBackend>('/tablets/loans/', {
        method: 'POST',
        body: JSON.stringify(prestamoHaciaBackend({ ...datos, horas })),
      });
      return prestamoDesdeBackend(creado, { id: usuario.id, nombre: usuario.nombre });
    } catch (error) {
      if (error instanceof ErrorApi && error.estado === 409) {
        const tramos =
          (error.cuerpo as { next_slots?: { date: string; start: string; end: string }[] })
            ?.next_slots ?? [];
        throw new ErrorPrestamo(error.message, alternativasTabletDesdeBackend(tramos));
      }
      throw error;
    }
  }
  if (!USAR_MOCKS) {
    return peticion<Prestamo>('/prestamos/', { method: 'POST', body: JSON.stringify(datos) });
  }
  // #310: los apartados que no se recogieron ya no ocupan su cupo.
  liberarNoRecogidos();

  if (!puedePedirTablet(usuario.tipo)) {
    throw new ErrorApi(403, MENSAJE_NO_PIDE_TABLET);
  }
  if (!datos.aceptaCondiciones) {
    throw new ErrorApi(400, 'Debes aceptar las condiciones de uso para solicitar la tablet.');
  }
  if (datos.responsabilidadAceptada !== true) {
    throw new ErrorApi(
      400,
      'Acepta la responsabilidad sobre el préstamo para solicitar la tablet.',
    );
  }
  // Las reglas de #224, como en capacitaciones y reservas. El tipo de usuario sale de la sesión:
  // decide qué datos académicos se exigen. Desde el #294 la tablet también exige la sede a los
  // estudiantes, como su formulario.
  const solicitante = { ...datos.datosSolicitante, tipo: usuario.tipo };
  const problema = problemaSolicitante(solicitante, { pedirIdentificacion: true, pedirSede: true });
  if (problema) {
    throw new ErrorApi(400, problema);
  }

  const { fecha, horaInicio } = datos;
  if (!esFechaValida(fecha) || !esHoraValida(horaInicio)) {
    throw new ErrorApi(400, 'Revisa la fecha y la hora del préstamo.');
  }
  if (!esInicioTablet(horaInicio)) {
    throw new ErrorApi(400, 'Empieza en punto o y media, por ejemplo 09:00 o 09:30.');
  }

  const parametros = await obtenerParametros();
  // #278: sin horas, las de `horasPrestamoTablet` (`tablet-loan-hours` del Backend).
  const horas = datos.horas ?? horasPorDefecto(parametros);
  const problemaDeHoras = problemaHoras(horas, parametros.horasMaximasPrestamo);
  if (problemaDeHoras) {
    throw new ErrorApi(400, problemaDeHoras);
  }
  const horaLimite = horaLimiteDe(horaInicio, horas);
  const horario = horarioDelDia(fecha, parametros);
  if (!esDiaHabil(fecha, parametros) || !horario) {
    throw new ErrorApi(400, 'La fecha no es un día hábil de la biblioteca.');
  }
  if (horaInicio < horario.abre || horaInicio >= horario.cierra) {
    throw new ErrorApi(400, 'La franja está fuera del horario de atención.');
  }
  if (horaLimite > horario.cierra) {
    throw new ErrorApi(
      400,
      `La devolución sería a las ${horaLimite} y la biblioteca cierra a las ${horario.cierra}. ` +
        'Pide menos horas.',
    );
  }
  // #278: y se aparta con hasta `diasMaximosTablet` días de anticipación (7 en el Backend).
  if (fecha > ultimoDiaTablet(parametros, hoyISO())) {
    throw new ErrorApi(400, mensajeDiasMaximosTablet(parametros));
  }
  // #310: sin anticipación mínima, como en el Backend; solo que la hora no haya pasado.
  if (new Date(`${fecha}T${horaInicio}:00`).getTime() < Date.now()) {
    throw new ErrorApi(400, 'Esa hora ya pasó: elige una más tarde.');
  }
  // #310: una persona no tiene dos préstamos que se crucen, como en el Backend.
  const yaTiene = prestamos.some(
    (prestamo) =>
      prestamo.solicitanteId === usuario.id &&
      prestamoOcupaFranja(prestamo, fecha, horaInicio, horaLimite),
  );
  if (yaTiene) {
    throw new ErrorApi(400, 'Ya tienes un préstamo de tablet en esa franja.');
  }

  // Primero las que hoy están disponibles: HU-23 solo entrega una tablet disponible.
  const libres = tabletsLibresEnFranja(tablets, prestamos, fecha, horaInicio, horaLimite).sort(
    (a, b) =>
      Number(b.estado === 'disponible') - Number(a.estado === 'disponible') ||
      a.codigo.localeCompare(b.codigo),
  );
  if (libres.length === 0) {
    const alternativas = buscarAlternativas(fecha, horaInicio, horaLimite, parametros);
    throw new ErrorPrestamo(
      `No hay una tablet libre de ${horaInicio} a ${horaLimite}.`,
      alternativas,
    );
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
    horas,
    datosSolicitante: aDatosSolicitante(valoresSolicitante(solicitante)),
    responsabilidadAceptada: { fechaHora: ahoraFechaHora() },
  };
  prestamos = [...prestamos, nuevo];

  crearNotificacion({
    usuarioId: usuario.id,
    solicitudId: nuevo.id,
    titulo: 'Préstamo de tablet reservado',
    mensaje: `Reservamos una tablet para el ${fecha} de ${horaInicio} a ${horaLimite}. Recógela en la biblioteca.`,
  });
  registrarEvento(
    'prestamo',
    nuevo.id,
    estadoDePrestamo(nuevo.estado),
    usuario.nombre,
    'Tablet reservada. Recógela en la biblioteca.',
  );

  // HU-25: la solicitud deja su registro (luego la entrega y la devolución lo actualizan).
  registrarUso({
    id: `uso-prestamo-${nuevo.id}`,
    servicio: 'tablets',
    finalidad: 'Préstamo de tablet',
    fecha: nuevo.fecha,
    fechaFin: nuevo.fecha,
    modalidad: 'presencial',
    estado: 'pendiente',
    usuario,
  });

  return simularRed(copiarPrestamo(nuevo));
}

/** Préstamos del usuario de la sesión, por fecha y hora, en todos sus estados (HU-22 y HU-30). */
export async function obtenerMisPrestamos(usuarioId: string): Promise<Prestamo[]> {
  if (usaApi('tablets')) {
    const solicitante = { id: usuarioId, nombre: useSesion.getState().usuario?.nombre ?? '' };
    const lista = await peticionTodas<PrestamoBackend, PrestamoBackend>(
      '/tablets/loans/',
      (prestamo) => prestamo,
    );
    return ordenarPrestamos(lista.map((prestamo) => prestamoDesdeBackend(prestamo, solicitante)));
  }
  if (USAR_MOCKS) liberarNoRecogidos();
  if (USAR_MOCKS) {
    const mios = prestamos.filter((prestamo) => prestamo.solicitanteId === usuarioId);
    return simularRed(ordenarPrestamos(mios).map(copiarPrestamo));
  }
  // Ruta provisional: confirmar con Backend. El usuario sale del token.
  return peticion<Prestamo[]>('/prestamos/mios/');
}

// ── #310: los préstamos que no se recogen se liberan ─────────────

/**
 * Con mocks, cancela los préstamos apartados que nadie recogió una hora después de su hora de
 * inicio (`noSeRecogio`) y libera su cupo, como el Backend. Se llama antes de leer o cambiar
 * préstamos, como los vencidos. Cada uno deja su rastro una sola vez: la notificación a la
 * persona, el evento del historial (HU-08) y el registro de uso (HU-25).
 */
function liberarNoRecogidos(ahora: Date = new Date()): void {
  prestamos = prestamos.map((prestamo) => {
    if (!noSeRecogio(prestamo, ahora)) return prestamo;
    crearNotificacion({
      usuarioId: prestamo.solicitanteId,
      solicitudId: prestamo.id,
      titulo: 'Préstamo de tablet cancelado',
      mensaje: `No recogiste la tablet que apartaste para el ${prestamo.fecha} a las ${prestamo.horaInicio}: se liberó una hora después. Si todavía la necesitas, pide otra.`,
    });
    registrarEvento(
      'prestamo',
      prestamo.id,
      estadoDePrestamo('cancelado'),
      'Sistema',
      'Se canceló porque no se recogió a tiempo: una hora después de la hora de inicio.',
    );
    registrarUso({
      id: `uso-prestamo-${prestamo.id}`,
      servicio: 'tablets',
      finalidad: 'Préstamo de tablet',
      fecha: prestamo.fecha,
      fechaFin: prestamo.fecha,
      modalidad: 'presencial',
      estado: 'cancelada',
      ...datosDeSolicitante(prestamo.solicitanteId),
    });
    return { ...prestamo, estado: 'cancelado' };
  });
}

// ── HU-24: préstamos vencidos ──────────────────────────────────

/** Por hora límite, el más antiguo primero. */
function ordenarVencidos(lista: Prestamo[]): Prestamo[] {
  return [...lista].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || a.horaLimite.localeCompare(b.horaLimite),
  );
}

/**
 * Alerta a quien maneja el préstamo de tablets (el permiso `tablets`, hoy la administración) y
 * avisa al usuario, una sola vez por préstamo (CA2). Si nadie lo tiene, el aviso al usuario se
 * crea igual.
 */
function avisarVencido(prestamo: Prestamo): void {
  if (avisosVencidos.has(prestamo.id)) return;

  const tablet = tablets.find((actual) => actual.id === prestamo.tabletId);
  const codigo = tablet?.codigo ?? 'sin código';
  const responsables = USUARIOS_DIRECTORIO.filter((usuario) => tienePermiso(usuario, 'tablets'));

  for (const responsable of responsables) {
    crearNotificacion({
      usuarioId: responsable.id,
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

  liberarNoRecogidos();
  const ahora = new Date();
  prestamos = prestamos.map((prestamo) => {
    if (prestamo.estado !== 'entregado' || minutosDeRetraso(prestamo, ahora) <= 0) {
      return prestamo;
    }
    // HU-08: el evento solo se registra al pasar de entregado a vencido, no en cada consulta.
    registrarEvento(
      'prestamo',
      prestamo.id,
      estadoDePrestamo('vencido'),
      'Sistema',
      `Préstamo vencido: pasó la hora límite (${prestamo.horaLimite}) sin devolver la tablet.`,
    );
    return { ...prestamo, estado: 'vencido' };
  });
  const vencidos = prestamos.filter((prestamo) => prestamo.estado === 'vencido');
  vencidos.forEach(avisarVencido);
  return simularRed(ordenarVencidos(vencidos).map(copiarPrestamo));
}
