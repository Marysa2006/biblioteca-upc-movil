/**
 * Autenticación (HU-05, capa de datos): inicio de sesión, registro (#203) y autorización de datos.
 *
 * Con datos de prueba, valida el correo y la contraseña contra src/api/mocks (usuarios.ts y
 * autenticacion.ts). Con la API (módulo `sesion` de `usaApi()`):
 * - `POST /token/` con `{email, password}` devuelve `{access, refresh}`; después, `GET /me/` y
 *   `GET /me/access/` dan el usuario, sus roles y sus permisos (src/api/backend/usuarios.ts).
 * - `POST /register/` crea la cuenta; luego se inicia sesión aparte.
 * - `POST /me/privacy-acceptance/` acepta la política vigente.
 * Las pantallas no cambian: solo cambia esta capa.
 */
import type { AceptacionPolitica, Usuario } from '@/types';
import { nuevaAceptacion } from '@/utils/privacidad';
import {
  problemaNuevaCuenta,
  TIPO_BACKEND,
  type CampoRegistro,
  type NuevaCuenta,
} from '@/utils/registro';

import { sedeHaciaBackend } from './backend/equivalencias';
import { usuarioDesdeBackend, type AccesoBackend, type PerfilBackend } from './backend/usuarios';
import { ErrorApi, peticion, simularRed, usaApi } from './cliente';
import { CONTRASENA_PRUEBA, USUARIOS_INACTIVOS_PRUEBA } from './mocks/autenticacion';
import { TOKEN_PRUEBA } from './mocks/usuarios';
import { guardarCelularRegistrado } from './perfil';
import {
  agregarAlDirectorio,
  buscarEnDirectorio,
  existeIdentificacion,
  guardarAceptacionEnDirectorio,
} from './usuarios';

export type { NuevaCuenta } from '@/utils/registro';

export type CredencialesLogin = {
  correo: string;
  contrasena: string;
};

export type RespuestaLogin = {
  usuario: Usuario;
  token: string;
  /** Con la API real, para renovar el token; los datos de prueba no lo tienen. */
  refresh?: string;
};

/** Los correos no distinguen mayúsculas ni espacios sobrantes. */
const normalizar = (correo: string) => correo.trim().toLowerCase();

/** Correo → contraseña de las cuentas creadas con el registro de prueba (#203), en memoria. */
const contrasenasRegistradas = new Map<string, string>();

/**
 * Inicia sesión con el correo institucional y la contraseña.
 * CA1: credenciales correctas y cuenta vigente → devuelve el usuario y el token.
 * CA2: credenciales inválidas → ErrorApi 401 (mismo mensaje para todos los casos,
 *      para no revelar qué correos existen).
 * CA3: cuenta inactiva → ErrorApi 403. Con la API real no se cumple: el Backend responde 401
 *      igual que con una contraseña incorrecta (anotado para el Backend).
 */
export async function iniciarSesionApi(credenciales: CredencialesLogin): Promise<RespuestaLogin> {
  if (!usaApi('sesion')) {
    const correo = normalizar(credenciales.correo);
    const invalidas = () => Promise.reject(new ErrorApi(401, 'Correo o contraseña incorrectos.'));

    // CA2: la contraseña se revisa primero, así una cuenta inactiva con contraseña
    // incorrecta también responde 401 y no revela que el correo existe.
    // Las cuentas creadas con el registro (#203) entran con su propia contraseña.
    const contrasenaEsperada = contrasenasRegistradas.get(correo) ?? CONTRASENA_PRUEBA;
    if (credenciales.contrasena !== contrasenaEsperada) {
      return invalidas();
    }

    // CA3: credenciales correctas, pero la cuenta está inactiva.
    if (USUARIOS_INACTIVOS_PRUEBA.some((u) => normalizar(u.correo) === correo)) {
      return Promise.reject(new ErrorApi(403, 'La cuenta está inactiva.'));
    }

    // CA1: el correo pertenece a un usuario de prueba vigente. Se busca en el directorio
    // mutable y no en la lista fija: así el rol o el permiso que la administración acaba de
    // dar se ven al volver a entrar (#256, CA1).
    const usuario = buscarEnDirectorio(correo);
    if (!usuario) {
      return invalidas();
    }

    return simularRed({ usuario, token: TOKEN_PRUEBA });
  }

  const tokens = await peticion<{ access: string; refresh: string }>('/token/', {
    method: 'POST',
    body: JSON.stringify({
      email: normalizar(credenciales.correo),
      password: credenciales.contrasena,
    }),
  });
  // La sesión todavía no tiene el token: estas dos llamadas llevan el suyo.
  const conToken = { headers: { Authorization: `Bearer ${tokens.access}` } };
  const [perfil, acceso] = await Promise.all([
    peticion<PerfilBackend>('/me/', conToken),
    peticion<AccesoBackend>('/me/access/', conToken),
  ]);
  return {
    usuario: usuarioDesdeBackend(perfil, acceso),
    token: tokens.access,
    refresh: tokens.refresh,
  };
}

// ── Registro provisional (#203) ─────────────────────────────────────────────────────────

/**
 * Error del registro con el campo al que se refiere, para mostrarlo bajo ese campo (CA2).
 * Con la API real, el Backend responde los errores por campo y `errorDeRegistro()` los traduce.
 */
export class ErrorRegistro extends ErrorApi {
  campo?: CampoRegistro;

  constructor(estado: number, mensaje: string, campo?: CampoRegistro) {
    super(estado, mensaje);
    this.name = 'ErrorRegistro';
    this.campo = campo;
  }
}

/** Los campos de `POST /register/` y el campo del formulario donde va su error. */
const CAMPO_REGISTRO_DESDE_BACKEND: Record<string, CampoRegistro> = {
  email: 'correo',
  password: 'contrasena',
  institutional_id: 'identificacion',
  first_name: 'nombres',
  last_name: 'apellidos',
  user_type: 'tipo',
  program: 'programa',
  semester: 'semestre',
  phone: 'celular',
  department: 'dependencia',
  campus: 'sede',
  faculty: 'facultad',
  accept_privacy: 'aceptaPrivacidad',
};

/**
 * El error de la API para el formulario: el primer campo que el formulario tiene, con su mensaje;
 * si el Backend no dice un campo conocido (`detail`, un 429), el mensaje va arriba del botón.
 */
function errorDeRegistro(error: ErrorApi): ErrorRegistro {
  for (const [campoBackend, mensaje] of Object.entries(error.campos ?? {})) {
    const campo = CAMPO_REGISTRO_DESDE_BACKEND[campoBackend];
    if (campo) return new ErrorRegistro(error.estado, mensaje, campo);
  }
  return new ErrorRegistro(error.estado, error.message);
}

/** Como el Backend: más de 10 intentos por minuto responden 429. */
const MAXIMO_INTENTOS_POR_MINUTO = 10;
let intentosRegistro: number[] = [];

/**
 * Crea una cuenta de la comunidad (#203, `POST register/`). La cuenta queda activa y **sin
 * rol** (CA3); después se inicia sesión aparte, como en el Backend (201 y luego `POST token/`).
 * - 400 con el campo: datos que no cumplen las reglas, correo que no es institucional, correo o
 *   cédula que ya existen, o contraseña débil (CA2).
 * - 429: más de 10 intentos por minuto.
 */
export async function registrarCuentaApi(cuenta: NuevaCuenta): Promise<void> {
  if (!usaApi('sesion')) {
    const ahora = Date.now();
    intentosRegistro = intentosRegistro.filter((momento) => ahora - momento < 60_000);
    intentosRegistro.push(ahora);
    if (intentosRegistro.length > MAXIMO_INTENTOS_POR_MINUTO) {
      throw new ErrorRegistro(
        429,
        'Hiciste muchos intentos. Espera un minuto y vuelve a intentarlo.',
      );
    }

    const problema = problemaNuevaCuenta(cuenta);
    if (problema) throw new ErrorRegistro(400, problema.mensaje, problema.campo);

    const correo = normalizar(cuenta.correo);
    const yaExiste =
      buscarEnDirectorio(correo) != null ||
      USUARIOS_INACTIVOS_PRUEBA.some((usuario) => normalizar(usuario.correo) === correo);
    if (yaExiste) {
      throw new ErrorRegistro(400, 'Ya hay una cuenta con ese correo. Inicia sesión.', 'correo');
    }
    if (existeIdentificacion(cuenta.identificacion)) {
      throw new ErrorRegistro(400, 'Ya hay una cuenta con esa cédula.', 'identificacion');
    }

    const nuevo: Usuario = {
      id: `u-registro-${ahora}`,
      nombre: `${cuenta.nombres} ${cuenta.apellidos}`,
      correo,
      tipo: cuenta.tipo,
      rolesPersonal: [],
      identificacion: cuenta.identificacion,
      // La sede y la facultad (#294) prellenan las solicitudes.
      ...(cuenta.sede ? { sede: cuenta.sede } : {}),
      ...(cuenta.facultad ? { facultad: cuenta.facultad } : {}),
      ...(cuenta.programa ? { programa: cuenta.programa } : {}),
      ...(cuenta.semestre != null ? { semestre: cuenta.semestre } : {}),
      ...(cuenta.dependencia ? { dependencia: cuenta.dependencia } : {}),
      // Revisión de la 1.1: la autorización se acepta al registrarse y queda en el usuario, así
      // que al iniciar sesión no se vuelve a pedir.
      aceptacionDatos: nuevaAceptacion(),
    };
    agregarAlDirectorio(nuevo);
    contrasenasRegistradas.set(correo, cuenta.contrasena);
    if (cuenta.celular) guardarCelularRegistrado(nuevo.id, cuenta.celular);
    await simularRed(null);
    return;
  }

  // Los nombres y valores del Backend: el semestre va como texto y la sede en mayúsculas (2.1.0).
  const sede = sedeHaciaBackend(cuenta.sede);
  try {
    await peticion<unknown>('/register/', {
      method: 'POST',
      body: JSON.stringify({
        email: normalizar(cuenta.correo),
        password: cuenta.contrasena,
        institutional_id: cuenta.identificacion,
        first_name: cuenta.nombres,
        last_name: cuenta.apellidos,
        user_type: TIPO_BACKEND[cuenta.tipo],
        ...(cuenta.programa ? { program: cuenta.programa } : {}),
        ...(cuenta.semestre != null ? { semester: String(cuenta.semestre) } : {}),
        ...(sede ? { campus: sede } : {}),
        ...(cuenta.facultad ? { faculty: cuenta.facultad } : {}),
        phone: cuenta.celular ?? '',
        department: cuenta.dependencia ?? '',
        accept_privacy: cuenta.aceptaPrivacidad,
      }),
    });
  } catch (error) {
    throw error instanceof ErrorApi ? errorDeRegistro(error) : error;
  }
}

/**
 * Guarda que la persona aceptó la autorización de datos vigente (revisión de la 1.1). Solo se
 * llama cuando la Universidad publica otra política: la primera se acepta al registrarse. Con la
 * API real es `POST /me/privacy-acceptance/`, sin cuerpo: el Backend registra la versión vigente.
 */
export async function aceptarPoliticaDatos(
  usuarioId: string,
  aceptacion: AceptacionPolitica,
): Promise<void> {
  if (!usaApi('sesion')) {
    guardarAceptacionEnDirectorio(usuarioId, aceptacion);
    await simularRed(null);
    return;
  }
  await peticion<unknown>('/me/privacy-acceptance/', { method: 'POST' });
}
