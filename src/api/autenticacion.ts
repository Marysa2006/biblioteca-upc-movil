/**
 * Autenticación provisional (HU-05, capa de datos).
 *
 * Mientras el inicio de sesión institucional (SSO de la UPC) no se defina con el
 * ingeniero de la biblioteca, estas funciones validan correo + contraseña contra
 * los datos de prueba de src/api/mocks (usuarios.ts y autenticacion.ts). Cuando el Backend publique el
 * endpoint, solo cambia la rama sin mocks; la pantalla (María, #12) no cambia.
 *
 * La ruta '/auth/login/' es provisional: confírmenla con el equipo de Backend.
 */
import type { Usuario } from '@/types';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { CONTRASENA_PRUEBA, USUARIOS_INACTIVOS_PRUEBA } from './mocks/autenticacion';
import { TOKEN_PRUEBA, USUARIOS_PRUEBA } from './mocks/usuarios';

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
    if (credenciales.contrasena !== CONTRASENA_PRUEBA) {
      return invalidas();
    }

    // CA3: credenciales correctas, pero la cuenta está inactiva.
    if (USUARIOS_INACTIVOS_PRUEBA.some((u) => normalizar(u.correo) === correo)) {
      return Promise.reject(new ErrorApi(403, 'La cuenta está inactiva.'));
    }

    // CA1: el correo pertenece a un usuario de prueba vigente.
    const usuario = USUARIOS_PRUEBA.find((u) => normalizar(u.correo) === correo);
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
