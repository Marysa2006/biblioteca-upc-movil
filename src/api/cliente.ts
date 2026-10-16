/**
 * Cliente HTTP: la única puerta de salida hacia la API del Backend.
 * Ninguna pantalla usa fetch directamente: las pantallas usan hooks (src/hooks),
 * los hooks usan funciones de src/api, y esas funciones usan peticion().
 *
 * Variables de entorno (archivo .env, ver .env.example):
 *   EXPO_PUBLIC_API_URL     URL base de la API, por ejemplo http://192.168.1.10:8000/api
 *   EXPO_PUBLIC_USAR_MOCKS  "true" mientras no exista la API; las funciones devuelven datos de prueba
 */
import { useSesion } from '@/store/sesion';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
export const USAR_MOCKS = process.env.EXPO_PUBLIC_USAR_MOCKS !== 'false';

export class ErrorApi extends Error {
  estado: number;

  constructor(estado: number, mensaje: string) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
  }
}

type OpcionesPeticion = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

/** Llama a la API con el token de la sesión y devuelve el JSON de la respuesta. */
export async function peticion<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const token = useSesion.getState().token;

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers,
    },
  });

  if (respuesta.status === 401) {
    useSesion.getState().cerrarSesion();
  }
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, `La API respondió ${respuesta.status} en ${ruta}`);
  }
  if (respuesta.status === 204) {
    return undefined as T;
  }
  return (await respuesta.json()) as T;
}

/** Devuelve datos de prueba con una pequeña demora, para ver los estados de carga. */
export function simularRed<T>(datos: T, demoraMs = 500): Promise<T> {
  return new Promise((resolver) => {
    setTimeout(() => resolver(datos), demoraMs);
  });
}
