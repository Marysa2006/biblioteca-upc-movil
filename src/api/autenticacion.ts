/**
 * Autenticación provisional (HU-05, capa de datos).
 *
 * Mientras el inicio de sesión institucional (SSO de la UPC) no se defina con el
 * ingeniero de la biblioteca, estas funciones validan correo + contraseña contra
 * los datos de prueba de src/api/mocks (usuarios.ts y autenticacion.ts). Cuando el Backend publique el
 * endpoint, solo cambia la rama sin mocks; la pantalla (María, #12) no cambia.
 *
 * La ruta '/auth/login/' es provisional: confírmenla con el equipo de Backend.
 *
 * El registro provisional (#203) usa `POST register/` del Backend, con sus mismos campos.
 */
import type { Usuario } from '@/types';
import {
  problemaNuevaCuenta,
  TIPO_BACKEND,
  type CampoRegistro,
  type NuevaCuenta,
} from '@/utils/registro';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { CONTRASENA_PRUEBA, USUARIOS_INACTIVOS_PRUEBA } from './mocks/autenticacion';
import { TOKEN_PRUEBA } from './mocks/usuarios';
import { guardarCelularRegistrado } from './perfil';
import { agregarAlDirectorio, buscarEnDirectorio, existeIdentificacion } from './usuarios';

export type { NuevaCuenta } from '@/utils/registro';

export type CredencialesLogin = {
  correo: string;
  contrasena: string;
};

export type RespuestaLogin = {
  usuario: Usuario;
  token: string;
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
 * CA3: cuenta inactiva → ErrorApi 403.
 */
export function iniciarSesionApi(credenciales: CredencialesLogin): Promise<RespuestaLogin> {
  if (USAR_MOCKS) {
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

  // API real: pendiente de que el Backend defina el endpoint oficial.
  return peticion<RespuestaLogin>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(credenciales),
  });
}

// ── Registro provisional (#203) ─────────────────────────────────────────────────────────

/**
 * Error del registro con el campo al que se refiere, para mostrarlo bajo ese campo (CA2).
 * Con la API real, el Backend responde los errores por campo; la conversión va al conectarla.
 */
export class ErrorRegistro extends ErrorApi {
  campo?: CampoRegistro;

  constructor(estado: number, mensaje: string, campo?: CampoRegistro) {
    super(estado, mensaje);
    this.name = 'ErrorRegistro';
    this.campo = campo;
  }
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
  if (USAR_MOCKS) {
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
      ...(cuenta.programa ? { programa: cuenta.programa } : {}),
      ...(cuenta.semestre != null ? { semestre: cuenta.semestre } : {}),
      ...(cuenta.dependencia ? { dependencia: cuenta.dependencia } : {}),
    };
    agregarAlDirectorio(nuevo);
    contrasenasRegistradas.set(correo, cuenta.contrasena);
    if (cuenta.celular) guardarCelularRegistrado(nuevo.id, cuenta.celular);
    await simularRed(null);
    return;
  }

  // Los nombres y valores del Backend (sección 1 del documento): el semestre va como texto.
  await peticion<unknown>('/register/', {
    method: 'POST',
    body: JSON.stringify({
      email: cuenta.correo,
      password: cuenta.contrasena,
      institutional_id: cuenta.identificacion,
      first_name: cuenta.nombres,
      last_name: cuenta.apellidos,
      user_type: TIPO_BACKEND[cuenta.tipo],
      ...(cuenta.programa ? { program: cuenta.programa } : {}),
      ...(cuenta.semestre != null ? { semester: String(cuenta.semestre) } : {}),
      phone: cuenta.celular ?? '',
      department: cuenta.dependencia ?? '',
      accept_privacy: cuenta.aceptaPrivacidad,
    }),
  });
}
