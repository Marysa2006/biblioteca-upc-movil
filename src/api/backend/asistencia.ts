import type { AsistenciaSesion, CodigoAsistencia, RegistroAsistencia } from '@/types';
import { TIPO_DESDE_BACKEND, type TipoUsuarioBackend } from './equivalencias';

export type RegistroAsistenciaBackend = {
  id: number; request_id: number; user_id: string | null; full_name: string;
  user_type: TipoUsuarioBackend | ''; program: string; semester: string;
  method: 'QR' | 'MANUAL'; created_at: string;
};
export type QrAsistenciaBackend = {
  request_id: number; token: string; valid_from: string; valid_until: string;
};
export type DatosAsistenciaManual = { usuarioId: string } | {
  nombre: string; tipo?: TipoUsuarioBackend; programa?: string; semestre?: string;
};

export function codigoDesdeBackend(respuesta: QrAsistenciaBackend): CodigoAsistencia {
  return {
    sesionId: String(respuesta.request_id), codigo: respuesta.token,
    desde: respuesta.valid_from, vence: respuesta.valid_until, cerrada: false,
  };
}

export function asistenciaDesdeBackend(registro: RegistroAsistenciaBackend): RegistroAsistencia {
  return {
    id: String(registro.id), sesionId: String(registro.request_id),
    usuarioId: registro.user_id ?? '', nombre: registro.full_name,
    tipoUsuario: registro.user_type ? TIPO_DESDE_BACKEND[registro.user_type] : undefined,
    programa: registro.program || undefined, semestre: registro.semester || undefined,
    fechaHora: registro.created_at.slice(0, 16).replace('T', ' '),
    medio: registro.method === 'QR' ? 'qr' : 'manual',
  };
}

export function listaAsistenciaDesdeBackend(sesionId: string, lista: RegistroAsistenciaBackend[]): AsistenciaSesion {
  return { sesionId, codigo: null, registros: lista.map(asistenciaDesdeBackend), total: lista.length, cerrada: false };
}

export function asistenciaManualHaciaBackend(datos: DatosAsistenciaManual) {
  if ('usuarioId' in datos) return { user: datos.usuarioId.trim() };
  return { full_name: datos.nombre.trim(), user_type: datos.tipo,
    program: datos.programa?.trim(), semester: datos.semestre?.trim() };
}
