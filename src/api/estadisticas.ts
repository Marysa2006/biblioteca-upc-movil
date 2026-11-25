/**
 * Registro de uso de los servicios (HU-25).
 * La captura real la hará el Backend; en la app, con datos de prueba, cada operación completa
 * agrega un registro para los reportes de HU-26 (CA1). Lo que falte del perfil se guarda como
 * 'no_informado' (CA2).
 * La ruta es provisional: confírmenla con el equipo de Backend.
 */
import {
  NO_INFORMADO,
  type EstadoUso,
  type FiltrosEstadisticas,
  type ModalidadUso,
  type RegistroUso,
  type ServicioEstadistica,
  type TipoUsuario,
  type Usuario,
} from '@/types';

import { hoyISO } from '@/utils/fechas';
import { periodoDe } from '@/utils/estadisticas';

import { USUARIOS_DIRECTORIO } from './mocks/usuarios';

import { consultaEstadisticas, indicadoresDesdeBackend, type ResumenBackend } from './backend/estadisticas';
import { peticion, peticionRespuesta, simularRed, usaApi, USAR_MOCKS } from './cliente';
import { REGISTROS_USO } from './mocks/estadisticas';

/** Copia mutable: con mocks, lo que se registra se ve durante la sesión. */
let registros: RegistroUso[] = REGISTROS_USO.map((registro) => ({ ...registro }));

/** Lo que se conoce de la operación al registrarla; el resto se completa o queda no informado. */
export type OperacionUso = {
  /** Id estable de la operación: `uso-reserva-<id>`… Si viene, actualiza ese registro. */
  id?: string;
  /** Quién la hizo; sin sesión (un visitante anónimo) se omite. */
  usuario?: Usuario | null;
  servicio: ServicioEstadistica;
  /** Para qué se usó el servicio, si la persona lo dijo. */
  finalidad?: string;
  /** 'AAAA-MM-DD'; por defecto, hoy. */
  fecha?: string;
  /** 'AAAA-MM-DD' del fin, si abarca varios días. */
  fechaFin?: string;
  modalidad?: ModalidadUso;
  estado?: EstadoUso;
  /** Calificación de la calidad, de 1 a 5, si la persona la dejó (versión 1.1). */
  calificacion?: number;
  /** Tema de la asesoría o línea de formación (#307). */
  tematica?: string;
  /** Solo tablets: horas de la entrega a la devolución (#307). */
  duracionHoras?: number;
  /**
   * true cuando esta operación es la respuesta del personal (aprobar, rechazar o proponer otra
   * fecha): guarda la hora de la primera respuesta para el tiempo de respuesta (#307).
   */
  respondida?: boolean;
};

export async function obtenerResumenEstadistico(filtros: FiltrosEstadisticas = {}) {
  const respuesta = await peticion<ResumenBackend>(`/statistics/summary/${consultaEstadisticas(filtros)}`);
  return indicadoresDesdeBackend(respuesta);
}

export function descargarEstadisticas(filtros: FiltrosEstadisticas, formato: 'csv' | 'pdf') {
  return peticionRespuesta(`/statistics/export/${consultaEstadisticas(filtros, formato)}`);
}

/** Hoy en la hora del celular, 'AAAA-MM-DD'. */
function hoy(): string {
  return hoyISO();
}

/**
 * Registra o actualiza el uso de una operación (HU-25, CA1).
 * **Un solo registro por operación**: el `id` se arma con la operación (`uso-reserva-<id>`,
 * `uso-prestamo-<id>`, `uso-cita-<id>`, `uso-capacitacion-<id>`), así que al cambiar de estado
 * se actualiza el mismo registro y la operación no se cuenta dos veces (no duplica los
 * indicadores de HU-26). El historial de cada cambio lo guarda HU-08.
 *
 * Sin sesión, el usuario y sus datos quedan 'no_informado'; si el perfil no trae programa,
 * también (CA2). Devuelve el registro guardado.
 */
export function registrarUso(operacion: OperacionUso): RegistroUso {
  const { usuario } = operacion;
  const id = operacion.id ?? `uso-${Date.now()}-${registros.length + 1}`;
  const anterior = registros.find((registro) => registro.id === id);
  const registro: RegistroUso = {
    id,
    usuarioId: usuario?.id ?? anterior?.usuarioId ?? NO_INFORMADO,
    nombre: usuario?.nombre ?? anterior?.nombre ?? NO_INFORMADO,
    tipoUsuario: usuario?.tipo ?? anterior?.tipoUsuario ?? NO_INFORMADO,
    programa: usuario?.programa?.trim() || anterior?.programa || NO_INFORMADO,
    servicio: operacion.servicio,
    finalidad: operacion.finalidad?.trim() || anterior?.finalidad || NO_INFORMADO,
    fecha: operacion.fecha ?? anterior?.fecha ?? hoy(),
    fechaFin: operacion.fechaFin ?? anterior?.fechaFin,
    modalidad: operacion.modalidad ?? anterior?.modalidad ?? NO_INFORMADO,
    estado: operacion.estado ?? 'completada',
    facultad: usuario?.facultad?.trim() || anterior?.facultad || NO_INFORMADO,
    sede: usuario?.sede?.trim() || anterior?.sede || NO_INFORMADO,
    semestre:
      (usuario?.semestre != null ? String(usuario.semestre) : '') ||
      anterior?.semestre ||
      NO_INFORMADO,
    calificacion: operacion.calificacion ?? anterior?.calificacion,
    // #307: la temática se conserva; la hora de la solicitud es la del primer registro, y la de
    // la respuesta, la de la primera vez que el personal respondió (reprogramar no la cambia).
    // Si el primer registro ya es la respuesta (una solicitud de los datos de prueba que no se
    // registró al pedirse), no se sabe cuándo se pidió: no entra en el tiempo de respuesta.
    tematica: operacion.tematica?.trim() || anterior?.tematica,
    duracionHoras: operacion.duracionHoras ?? anterior?.duracionHoras,
    solicitadaEl: anterior
      ? anterior.solicitadaEl
      : operacion.respondida
        ? undefined
        : new Date().toISOString(),
    respondidaEl:
      anterior?.respondidaEl ?? (operacion.respondida ? new Date().toISOString() : undefined),
  };
  registros = anterior
    ? registros.map((actual) => (actual.id === id ? registro : actual))
    : [...registros, registro];
  return { ...registro };
}

/** Aplica los filtros de HU-26 a la lista de registros (CA1 y CA3). Pura y exportada para probarla. */
export function filtrarRegistros(
  lista: RegistroUso[],
  filtros: FiltrosEstadisticas = {},
): RegistroUso[] {
  return lista.filter((registro) => {
    if (filtros.desde && registro.fecha < filtros.desde) return false;
    if (filtros.hasta && registro.fecha > filtros.hasta) return false;
    if (filtros.servicio && filtros.servicio !== 'todos' && registro.servicio !== filtros.servicio) {
      return false;
    }
    if (
      filtros.tipoUsuario &&
      filtros.tipoUsuario !== 'todos' &&
      registro.tipoUsuario !== filtros.tipoUsuario
    ) {
      return false;
    }
    if (filtros.programa && filtros.programa !== 'todos' && registro.programa !== filtros.programa) {
      return false;
    }
    // Versión 1.1 (#259): los tres cruces nuevos.
    if (filtros.facultad && filtros.facultad !== 'todos' && registro.facultad !== filtros.facultad) {
      return false;
    }
    if (filtros.sede && filtros.sede !== 'todos' && registro.sede !== filtros.sede) {
      return false;
    }
    if (filtros.periodo && filtros.periodo !== 'todos' && periodoDe(registro.fecha) !== filtros.periodo) {
      return false;
    }
    // @deprecated: el semestre del estudiante ya no es un filtro (#278); se sigue aceptando para
    // no romper a quien lo use, pero el cruce de tiempo es `periodo`.
    if (filtros.semestre && filtros.semestre !== 'todos' && registro.semestre !== filtros.semestre) {
      return false;
    }
    return true;
  });
}

/** Registros de uso que cumplen los filtros, del más reciente al más antiguo (HU-25, CA3). */
export function obtenerRegistrosUso(filtros: FiltrosEstadisticas = {}): Promise<RegistroUso[]> {
  if (usaApi('estadisticas')) return Promise.resolve([]);
  if (USAR_MOCKS) {
    const filtrados = filtrarRegistros(registros, filtros).sort((a, b) =>
      b.fecha.localeCompare(a.fecha),
    );
    return simularRed(filtrados.map((registro) => ({ ...registro })));
  }
  const consulta = new URLSearchParams();
  if (filtros.desde) consulta.set('desde', filtros.desde);
  if (filtros.hasta) consulta.set('hasta', filtros.hasta);
  if (filtros.servicio && filtros.servicio !== 'todos') consulta.set('servicio', filtros.servicio);
  if (filtros.tipoUsuario && filtros.tipoUsuario !== 'todos') {
    consulta.set('tipo_usuario', filtros.tipoUsuario);
  }
  if (filtros.programa && filtros.programa !== 'todos') consulta.set('programa', filtros.programa);
  const cadena = consulta.toString();
  return peticion<RegistroUso[]>(`/estadisticas/registros/${cadena ? `?${cadena}` : ''}`);
}

/** Para las pruebas y los mocks: la lista actual, sin copiar (no la expongas a las pantallas). */
export function registrosActuales(): RegistroUso[] {
  return registros;
}

/** @internal Reinicia los registros a los datos de prueba (solo para las pruebas). */
export function reiniciarRegistrosDePrueba(): void {
  registros = REGISTROS_USO.map((registro) => ({ ...registro }));
}

/** Tipo de usuario tal como lo espera el registro; útil para no repetir el cast en los mocks. */
export type TipoUsuarioUso = TipoUsuario | typeof NO_INFORMADO;


/** Datos del solicitante para el registro de uso (lo comparten reservas, asesorías y tablets). */
export function datosDeSolicitante(usuarioId: string) {
  const usuario = USUARIOS_DIRECTORIO.find((persona) => persona.id === usuarioId);
  return usuario ? { usuario: { ...usuario } } : {};
}
