/**
 * Control de asistencia con QR de las asesorías (HU-33, función plus).
 * El facilitador abre la asistencia de una sesión, muestra un QR temporal, ve quién se
 * registró y puede marcar a mano a quien no pudo escanear. Al cerrarla, el QR deja de aceptar.
 *
 * La persona registra su asistencia escaneando ese QR (HU-32).
 *
 * Validar el QR contra el Backend necesita un endpoint: mientras tanto, el mock valida el
 * código, el vencimiento y que la asistencia siga abierta.
 * La ruta es provisional: confírmenla con el equipo de Backend.
 */
import type {
  AsistenciaSesion,
  CodigoAsistencia,
  MedioAsistencia,
  RegistroAsistencia,
  Usuario,
} from '@/types';
import { leerCodigoAsistencia } from '@/utils/asistencia';
import { hoyISO } from '@/utils/fechas';
import { ahoraFechaHora } from '@/utils/tablets';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { registrarUso } from './estadisticas';
import { USUARIOS_DIRECTORIO } from './mocks/usuarios';

/** Cuántos minutos sirve el código de una sesión (CA1: tiempo limitado). */
export const MINUTOS_VIGENCIA_CODIGO = 45;

/** Estado en memoria de la asistencia de cada sesión, solo para los datos de prueba. */
type EstadoAsistencia = {
  codigo: string | null;
  /** 'AAAA-MM-DD HH:MM'. */
  vence: string | null;
  cerrada: boolean;
  registros: RegistroAsistencia[];
};

const asistencias = new Map<string, EstadoAsistencia>();

/** Estado de la sesión, creándolo vacío la primera vez. */
function estadoDe(sesionId: string): EstadoAsistencia {
  const actual = asistencias.get(sesionId) ?? {
    codigo: null,
    vence: null,
    cerrada: false,
    registros: [],
  };
  asistencias.set(sesionId, actual);
  return actual;
}

/** Suma minutos a una fecha y hora 'AAAA-MM-DD HH:MM'. */
function sumarMinutos(fechaHora: string, minutos: number): string {
  const [fecha, hora] = fechaHora.split(' ');
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const [h, m] = hora.split(':').map(Number);
  const momento = new Date(anio, mes - 1, dia, h, m + minutos);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${momento.getFullYear()}-${dos(momento.getMonth() + 1)}-${dos(
    momento.getDate(),
  )} ${dos(momento.getHours())}:${dos(momento.getMinutes())}`;
}

/** Código temporal: seis caracteres, distinto cada vez que se abre la asistencia. */
function codigoTemporal(sesionId: string): string {
  const base = `${sesionId}-${Date.now()}`;
  let suma = 0;
  for (const caracter of base) {
    suma = (suma * 31 + caracter.charCodeAt(0)) % 1_000_000;
  }
  return String(suma).padStart(6, '0');
}

/** Copia de un registro para no exponer el almacén. */
const copiarRegistro = (registro: RegistroAsistencia): RegistroAsistencia => ({ ...registro });

/** Arma la respuesta de la sesión con su total (CA2). */
function aAsistencia(sesionId: string): AsistenciaSesion {
  const estado = estadoDe(sesionId);
  const codigo: CodigoAsistencia | null =
    estado.codigo && estado.vence && !estado.cerrada
      ? {
          sesionId,
          codigo: estado.codigo,
          vence: estado.vence,
          cerrada: estado.cerrada,
        }
      : null;
  return {
    sesionId,
    codigo,
    registros: estado.registros.map(copiarRegistro),
    total: estado.registros.length,
  };
}

/**
 * Abre la asistencia de una sesión y devuelve su código temporal (CA1).
 * Si ya estaba abierta y no ha vencido, reutiliza el mismo código para no invalidar el QR
 * que el facilitador ya está mostrando.
 */
export function abrirAsistencia(sesionId: string): Promise<AsistenciaSesion> {
  if (!sesionId?.trim()) {
    return Promise.reject(new ErrorApi(400, 'Falta la sesión.'));
  }
  if (USAR_MOCKS) {
    const estado = estadoDe(sesionId);
    if (estado.cerrada) {
      return Promise.reject(new ErrorApi(400, 'Esta asistencia ya se cerró.'));
    }
    const ahora = ahoraFechaHora();
    const vigente = estado.codigo !== null && estado.vence !== null && estado.vence > ahora;
    if (!vigente) {
      estado.codigo = codigoTemporal(sesionId);
      estado.vence = sumarMinutos(ahora, MINUTOS_VIGENCIA_CODIGO);
    }
    return simularRed(aAsistencia(sesionId));
  }
  return peticion<AsistenciaSesion>(`/asesorias/citas/${sesionId}/asistencia/abrir/`, {
    method: 'POST',
  });
}

/** Asistentes de la sesión, del primero al último que se registró (CA2). */
export function obtenerAsistentes(sesionId: string): Promise<AsistenciaSesion> {
  if (USAR_MOCKS) {
    return simularRed(aAsistencia(sesionId));
  }
  return peticion<AsistenciaSesion>(`/asesorias/citas/${sesionId}/asistencia/`);
}

/**
 * Registra la asistencia a partir del QR (CA1 y CA2). Rechaza con 400 si el código no es el
 * de la sesión, si ya venció o si la asistencia está cerrada (CA4), y si la persona ya se
 * registró (no se cuenta dos veces).
 */
export function registrarAsistenciaQr(
  sesionId: string,
  codigo: string,
  usuarioId: string,
): Promise<AsistenciaSesion> {
  if (USAR_MOCKS) {
    const estado = estadoDe(sesionId);
    if (estado.cerrada) {
      return Promise.reject(new ErrorApi(400, 'La asistencia de esta sesión ya cerró.'));
    }
    if (!estado.codigo || !estado.vence) {
      return Promise.reject(new ErrorApi(400, 'La asistencia todavía no se ha abierto.'));
    }
    if (codigo?.trim() !== estado.codigo) {
      return Promise.reject(new ErrorApi(400, 'Ese código no es de esta sesión.'));
    }
    if (estado.vence <= ahoraFechaHora()) {
      return Promise.reject(new ErrorApi(400, 'El código venció. Pídele otro al facilitador.'));
    }
    agregarRegistro(sesionId, usuarioId, 'qr');
    return simularRed(aAsistencia(sesionId));
  }
  return peticion<AsistenciaSesion>(`/asesorias/citas/${sesionId}/asistencia/qr/`, {
    method: 'POST',
    body: JSON.stringify({ codigo, usuarioId }),
  });
}

/**
 * Registra la asistencia de la persona de la sesión con el texto que escaneó (HU-32).
 * Lee la sesión y el código del QR, y las reglas son las de registrarAsistenciaQr(): otra
 * sesión, vencido o cerrada responden 400 (CA2), y volver a escanear no duplica (CA3).
 * Deja un registro de uso por sesión y persona (HU-25), que se actualiza si vuelve a escanear.
 */
export async function registrarAsistencia(
  codigo: string,
  usuario: Usuario,
): Promise<AsistenciaSesion> {
  const datos = leerCodigoAsistencia(codigo);
  if (!datos) {
    throw new ErrorApi(400, 'Ese código no es de una asistencia.');
  }
  // Si falla, lanza antes de registrar el uso.
  const asistencia = await registrarAsistenciaQr(datos.sesionId, datos.codigo, usuario.id);
  // Con la API real, confirmar con Backend si el servidor también registra este uso.
  registrarUso({
    id: `uso-asistencia-${datos.sesionId}-${usuario.id}`,
    usuario,
    servicio: 'asesorias',
    finalidad: 'Asistencia con QR',
    fecha: hoyISO(),
    estado: 'completada',
  });
  return asistencia;
}

/** Agrega el registro si la persona no estaba ya; el facilitador puede marcar a cualquiera. */
function agregarRegistro(sesionId: string, usuarioId: string, medio: MedioAsistencia): void {
  const estado = estadoDe(sesionId);
  if (estado.registros.some((registro) => registro.usuarioId === usuarioId)) {
    return;
  }
  const persona = USUARIOS_DIRECTORIO.find((usuario) => usuario.id === usuarioId);
  estado.registros = [
    ...estado.registros,
    {
      id: `asi-${sesionId}-${usuarioId}`,
      sesionId,
      usuarioId,
      nombre: persona?.nombre ?? 'Asistente',
      tipoUsuario: persona?.tipo,
      programa: persona?.programa,
      fechaHora: ahoraFechaHora(),
      medio,
    },
  ];
}

/**
 * Marca la asistencia a mano (CA3), para quien no pudo escanear. No exige el código, pero sí
 * que la asistencia siga abierta.
 */
export function marcarAsistenciaManual(
  sesionId: string,
  usuarioId: string,
): Promise<AsistenciaSesion> {
  if (USAR_MOCKS) {
    const estado = estadoDe(sesionId);
    if (estado.cerrada) {
      return Promise.reject(new ErrorApi(400, 'La asistencia de esta sesión ya cerró.'));
    }
    if (!usuarioId?.trim()) {
      return Promise.reject(new ErrorApi(400, 'Elige a la persona que asistió.'));
    }
    if (!USUARIOS_DIRECTORIO.some((usuario) => usuario.id === usuarioId)) {
      return Promise.reject(new ErrorApi(404, 'Esa persona no existe.'));
    }
    agregarRegistro(sesionId, usuarioId, 'manual');
    return simularRed(aAsistencia(sesionId));
  }
  return peticion<AsistenciaSesion>(`/asesorias/citas/${sesionId}/asistencia/manual/`, {
    method: 'POST',
    body: JSON.stringify({ usuarioId }),
  });
}

/**
 * Cierra la asistencia (CA4): el QR deja de aceptar registros y la sesión conserva la lista
 * de asistentes para la vista del facilitador.
 */
export function cerrarAsistencia(sesionId: string): Promise<AsistenciaSesion> {
  if (USAR_MOCKS) {
    const estado = estadoDe(sesionId);
    if (estado.cerrada) {
      return Promise.reject(new ErrorApi(400, 'Esta asistencia ya estaba cerrada.'));
    }
    estado.cerrada = true;
    return simularRed(aAsistencia(sesionId));
  }
  return peticion<AsistenciaSesion>(`/asesorias/citas/${sesionId}/asistencia/cerrar/`, {
    method: 'POST',
  });
}

/** @internal Reinicia la asistencia de las pruebas (solo para los tests). */
export function reiniciarAsistenciaDePrueba(): void {
  asistencias.clear();
}
