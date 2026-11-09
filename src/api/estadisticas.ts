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

import { USUARIOS_DIRECTORIO } from './mocks/usuarios';

import { peticion, simularRed, USAR_MOCKS } from './cliente';
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
};

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
    return true;
  });
}

/** Registros de uso que cumplen los filtros, del más reciente al más antiguo (HU-25, CA3). */
export function obtenerRegistrosUso(filtros: FiltrosEstadisticas = {}): Promise<RegistroUso[]> {
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
