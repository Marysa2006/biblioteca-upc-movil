/**
 * Cliente HTTP: la única puerta de salida hacia la API del Backend.
 * Ninguna pantalla usa fetch directamente: las pantallas usan hooks (src/hooks),
 * los hooks usan funciones de src/api, y esas funciones usan peticion().
 *
 * Aquí va solo lo común a todos los módulos: la URL base, el token y su renovación, los errores
 * del Backend, las listas paginadas y el aviso de servidor lento. Lo propio de cada módulo (rutas
 * en inglés, nombres de campos, estados) se traduce en src/api/backend/.
 *
 * Variables de entorno (archivo .env, ver .env.example):
 *   EXPO_PUBLIC_API_URL      URL base de la API, con el prefijo: https://…/api/v1.
 *                            En un APK solo funciona HTTPS (#299, sin usesCleartextTraffic); un
 *                            servidor local por http (http://192.168.1.10:8000/api/v1) solo en Expo Go.
 *   EXPO_PUBLIC_USAR_MOCKS   "false": toda la app usa la API. "true": datos de prueba, salvo los
 *                            módulos de EXPO_PUBLIC_API_MODULOS.
 *   EXPO_PUBLIC_API_MODULOS  Módulos que ya usan la API aunque USAR_MOCKS sea "true", separados por
 *                            comas (por ejemplo "sesion"). Sirve para conectar la app de a poco.
 */
import { contarLlamadaLenta, MS_CONEXION_LENTA } from '@/store/conexion';
import { useSesion } from '@/store/sesion';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
export const USAR_MOCKS = process.env.EXPO_PUBLIC_USAR_MOCKS !== 'false';

/**
 * Los módulos de la app que se conectan a la API uno por uno. `sesion` es el inicio de sesión,
 * el registro, la autorización de datos y el perfil: van juntos porque comparten el token.
 */
export type ModuloApi =
  | 'sesion'
  | 'servicios'
  | 'contenidos'
  | 'recursos'
  | 'guias'
  | 'fotosInicio'
  | 'autoarchivo'
  | 'parametros'
  | 'espacios'
  | 'bloqueos'
  | 'reservas'
  | 'asesorias'
  | 'capacitaciones'
  | 'tablets'
  | 'solicitudes'
  | 'notificaciones'
  | 'usuarios'
  | 'estadisticas'
  | 'asistencia';

const MODULOS_CON_API = new Set(
  (process.env.EXPO_PUBLIC_API_MODULOS ?? '')
    .split(',')
    .map((modulo) => modulo.trim())
    .filter(Boolean),
);

/** ¿Este módulo habla con la API? Siempre, si USAR_MOCKS es "false"; si no, solo si está en la lista. */
export function usaApi(modulo: ModuloApi): boolean {
  return !USAR_MOCKS || MODULOS_CON_API.has(modulo);
}

/**
 * Error de la API. `message` es el texto del Backend si lo trae (casi siempre en español), así
 * que `mensajeErrorGuardar()` lo muestra tal cual.
 * - `codigo`: el `error_code` del Backend (`TOO_SOON`, `SCHEDULE_CONFLICT`…), si lo trae.
 * - `campos`: el primer mensaje de cada campo de un 400 de validación (`{email: '…'}`), con los
 *   nombres del Backend. Cada módulo los traduce a los de su formulario.
 */
export class ErrorApi extends Error {
  estado: number;
  codigo?: string;
  campos?: Record<string, string>;

  constructor(
    estado: number,
    mensaje: string,
    detalle: { codigo?: string; campos?: Record<string, string> } = {},
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
    if (detalle.codigo) this.codigo = detalle.codigo;
    if (detalle.campos) this.campos = detalle.campos;
  }
}

/** El primer texto de un valor de error de DRF: un texto, una lista o un objeto anidado. */
function primerTexto(valor: unknown): string | null {
  if (typeof valor === 'string') return valor;
  if (Array.isArray(valor)) {
    for (const elemento of valor) {
      const texto = primerTexto(elemento);
      if (texto) return texto;
    }
    return null;
  }
  if (valor && typeof valor === 'object') return primerTexto(Object.values(valor));
  return null;
}

/**
 * Convierte la respuesta de error del Backend en un ErrorApi. Las tres formas que devuelve:
 * `{detail}`, `{detail, error_code}` y `{campo: ['mensaje']}` (validación). Es pura.
 */
export function errorDesdeRespuesta(estado: number, cuerpo: unknown, ruta: string): ErrorApi {
  const generico = `La API respondió ${estado} en ${ruta}`;
  if (!cuerpo || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
    return new ErrorApi(estado, primerTexto(cuerpo) ?? generico);
  }
  const datos = cuerpo as Record<string, unknown>;
  const codigo = typeof datos.error_code === 'string' ? datos.error_code : undefined;

  const detalle = primerTexto(datos.detail);
  if (detalle) return new ErrorApi(estado, detalle, { codigo });

  const campos: Record<string, string> = {};
  for (const [campo, valor] of Object.entries(datos)) {
    if (campo === 'error_code') continue;
    const texto = primerTexto(valor);
    if (texto) campos[campo] = texto;
  }
  const primero = campos.non_field_errors ?? Object.values(campos)[0];
  return new ErrorApi(estado, primero ?? generico, {
    codigo,
    campos: Object.keys(campos).length > 0 ? campos : undefined,
  });
}

/** Hasta cuánto se espera una respuesta: el servidor de pruebas tarda hasta un minuto en despertar. */
const MS_LIMITE_ESPERA = 60_000;

type OpcionesPeticion = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

/** Rutas que no se reintentan con otro token: son las que lo piden o lo renuevan. */
const RUTAS_SIN_RENOVAR = ['/token/', '/token/refresh/', '/register/'];

/** La renovación en curso: si fallan varias llamadas a la vez, se renueva una sola vez. */
let renovacion: Promise<boolean> | null = null;

/** Pide un `access` nuevo con el `refresh`. El Backend también cambia el `refresh` (rotación). */
function renovarToken(): Promise<boolean> {
  const refresh = useSesion.getState().refresh;
  if (!refresh) return Promise.resolve(false);
  renovacion ??= (async () => {
    try {
      const respuesta = await llamar('/token/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
      });
      if (!respuesta.ok) return false;
      const tokens = (await respuesta.json()) as { access: string; refresh?: string };
      useSesion.getState().actualizarTokens(tokens.access, tokens.refresh ?? refresh);
      return true;
    } catch {
      return false;
    } finally {
      renovacion = null;
    }
  })();
  return renovacion;
}

/**
 * El token que se manda al Backend: solo el de una sesión real. Con la sesión de datos de prueba,
 * su token no le sirve a Django, que responde 401 a un token inválido aunque la ruta sea pública;
 * así los módulos ya conectados funcionan como sin sesión mientras `sesion` siga con mocks.
 */
function tokenDeLaSesion(): string | null {
  return usaApi('sesion') ? useSesion.getState().token : null;
}

/** Una llamada HTTP con el token de la sesión, el límite de espera y el aviso de servidor lento. */
async function llamar(ruta: string, opciones: OpcionesPeticion): Promise<Response> {
  const token = tokenDeLaSesion();
  const controlador = new AbortController();
  let lenta = false;
  const avisoLenta = setTimeout(() => {
    lenta = true;
    contarLlamadaLenta(1);
  }, MS_CONEXION_LENTA);
  const limite = setTimeout(() => controlador.abort(), MS_LIMITE_ESPERA);

  try {
    return await fetch(ruta.startsWith('http') ? ruta : `${API_URL}${ruta}`, {
      ...opciones,
      signal: controlador.signal,
      headers: {
        // Con FormData (un archivo, #303), fetch pone multipart/form-data con su separador.
        ...(opciones.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opciones.headers,
      },
    });
  } catch (error) {
    if (controlador.signal.aborted) {
      throw new ErrorApi(0, 'La biblioteca no respondió a tiempo. Inténtalo de nuevo.');
    }
    throw error;
  } finally {
    clearTimeout(avisoLenta);
    clearTimeout(limite);
    if (lenta) contarLlamadaLenta(-1);
  }
}

/**
 * Llama a la API y devuelve el JSON de la respuesta. `ruta` va sin el prefijo (`/me/`), o es una
 * URL completa (el `next` de una lista paginada).
 * Con un 401, renueva el token una vez y reintenta; si no se puede, cierra la sesión.
 */
export async function peticion<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  let respuesta = await llamar(ruta, opciones);

  // Un 401 solo toca la sesión si es real: la de datos de prueba no depende del Backend.
  if (respuesta.status === 401 && usaApi('sesion') && !RUTAS_SIN_RENOVAR.includes(ruta)) {
    // Si la llamada trae su propio token (justo después del login), no se renueva el de la sesión.
    const tokenPropio = opciones.headers?.Authorization != null;
    if (!tokenPropio && (await renovarToken())) {
      respuesta = await llamar(ruta, opciones);
    }
    if (respuesta.status === 401 && !tokenPropio) useSesion.getState().cerrarSesion();
  }

  if (!respuesta.ok) {
    const cuerpo: unknown = await respuesta.json().catch(() => null);
    throw errorDesdeRespuesta(respuesta.status, cuerpo, ruta);
  }
  if (respuesta.status === 204) {
    return undefined as T;
  }
  return (await respuesta.json()) as T;
}

// ── Listas paginadas ───────────────────────────────────────────────────────────────────────

/** Una página del Backend: `{count, next, previous, results}`, 20 por defecto y hasta 100. */
export type PaginaBackend<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

/** Una página ya traducida para el componente `Paginacion`. */
export type Pagina<T> = { elementos: T[]; total: number; hayMas: boolean };

const TAMANO_MAXIMO_PAGINA = 100;

/** Agrega parámetros a una ruta que puede traer ya otros (`?status=…`). */
function conParametros(ruta: string, parametros: Record<string, string | number>): string {
  const consulta = Object.entries(parametros)
    .map(([clave, valor]) => `${clave}=${encodeURIComponent(String(valor))}`)
    .join('&');
  return `${ruta}${ruta.includes('?') ? '&' : '?'}${consulta}`;
}

/** Una página de una lista (la `pagina` empieza en 1), como la pide la web: `?page=N&page_size=10`. */
export async function peticionPagina<B, T>(
  ruta: string,
  pagina: number,
  tamano: number,
  traducir: (elemento: B) => T,
): Promise<Pagina<T>> {
  const datos = await peticion<PaginaBackend<B>>(
    conParametros(ruta, { page: pagina, page_size: tamano }),
  );
  return { elementos: datos.results.map(traducir), total: datos.count, hayMas: datos.next != null };
}

/**
 * Todos los elementos de una lista, siguiendo `next` de 100 en 100. Para listas que la app filtra
 * o agrupa por su cuenta (festivos, temas…), no para las que crecen sin límite.
 */
export async function peticionTodas<B, T>(
  ruta: string,
  traducir: (elemento: B) => T,
): Promise<T[]> {
  const elementos: T[] = [];
  let siguiente: string | null = conParametros(ruta, { page_size: TAMANO_MAXIMO_PAGINA });
  while (siguiente) {
    const datos: PaginaBackend<B> = await peticion<PaginaBackend<B>>(siguiente);
    elementos.push(...datos.results.map(traducir));
    // `next` es una URL completa; detrás de un proxy puede venir con http, así que se usa la ruta.
    siguiente = datos.next ? datos.next.replace(/^https?:\/\/[^/]+\/api\/v1/, '') : null;
  }
  return elementos;
}

/** Devuelve datos de prueba con una pequeña demora, para ver los estados de carga. */
export function simularRed<T>(datos: T, demoraMs = 500): Promise<T> {
  return new Promise((resolver) => {
    setTimeout(() => resolver(datos), demoraMs);
  });
}
