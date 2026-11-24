/**
 * Hooks de autenticación provisional (HU-05, capa de datos).
 *
 * La pantalla de inicio de sesión (María, #12) usa estos hooks: no llama a la API
 * ni a los datos de prueba directamente. La navegación (router.replace) queda en la
 * pantalla, no aquí.
 *
 * Se llama useAutenticacion y no useSesion para no chocar con el nombre del store
 * (src/store/sesion.ts).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  ErrorRegistro,
  iniciarSesionApi,
  registrarCuentaApi,
  type CredencialesLogin,
  type NuevaCuenta,
} from '@/api/autenticacion';
import { aceptarPoliticaDatos } from '@/api/autenticacion';
import { ErrorApi } from '@/api/cliente';
import { useSesion } from '@/store/sesion';
import type { CampoRegistro } from '@/utils/registro';

/**
 * Inicia sesión: al terminar bien, guarda el usuario y el token en la sesión
 * (que se guarda cifrada en el celular). La pantalla obtiene mutate, isPending y error.
 */
export function useIniciarSesion() {
  return useMutation({
    mutationFn: (credenciales: CredencialesLogin) => iniciarSesionApi(credenciales),
    onSuccess: ({ usuario, token }) => {
      useSesion.getState().iniciarSesion(usuario, token);
    },
  });
}

/**
 * Registra una cuenta de la comunidad (#203) y, como en el Backend, después inicia sesión con el
 * correo y la contraseña (CA1). La autorización de datos ya se aceptó en el formulario
 * (`accept_privacy`), así que queda guardada y no vuelve a pedirse al entrar.
 * La navegación queda en la pantalla.
 */
export function useRegistrarCuenta() {
  return useMutation({
    mutationFn: async (cuenta: NuevaCuenta) => {
      await registrarCuentaApi(cuenta);
      return iniciarSesionApi({ correo: cuenta.correo, contrasena: cuenta.contrasena });
    },
    onSuccess: ({ usuario, token }) => {
      const sesion = useSesion.getState();
      sesion.iniciarSesion(usuario, token);
      sesion.aceptarTratamientoDatos();
    },
  });
}

/**
 * Acepta la autorización de datos vigente (revisión de la 1.1): la guarda en la sesión al instante
 * (el diálogo se cierra) y en el usuario, en el mock o en el Backend. Solo hace falta cuando la
 * Universidad publica otra política; la primera se acepta al registrarse.
 */
export function useAceptarTratamientoDatos() {
  return useMutation({
    mutationFn: async () => {
      useSesion.getState().aceptarTratamientoDatos();
      const { usuario } = useSesion.getState();
      if (usuario?.aceptacionDatos) await aceptarPoliticaDatos(usuario.id, usuario.aceptacionDatos);
    },
  });
}

/**
 * El error del registro para la pantalla: el campo donde va (si la API lo dice) y el mensaje.
 * Sin campo, el mensaje va arriba del botón.
 */
export function errorRegistro(error: Error): { campo?: CampoRegistro; mensaje: string } {
  if (error instanceof ErrorRegistro) return { campo: error.campo, mensaje: error.message };
  if (error instanceof ErrorApi && (error.estado === 400 || error.estado === 429)) {
    return { mensaje: error.message };
  }
  return { mensaje: 'No pudimos crear la cuenta. Revisa tu conexión e inténtalo de nuevo.' };
}

/**
 * Cierra la sesión y borra de la caché los datos del usuario anterior
 * (solicitudes, servicios, etc., que ya no deben verse tras salir).
 */
export function useCerrarSesion() {
  const queryClient = useQueryClient();

  return () => {
    useSesion.getState().cerrarSesion();
    queryClient.clear();
  };
}

/**
 * Convierte el error del login en un mensaje para mostrar en la pantalla.
 * Sirve igual con datos de prueba o con la API real.
 */
export function mensajeErrorLogin(error: unknown): string {
  if (error instanceof ErrorApi) {
    if (error.estado === 403) {
      // Provisional: aún no conocemos el procedimiento real de reactivación,
      // así que el mensaje se deja genérico. Ajustar con la biblioteca.
      return 'Tu cuenta está inactiva. Contacta a la biblioteca para más información.';
    }
    if (error.estado === 401) {
      return 'Correo o contraseña incorrectos.';
    }
  }
  return 'No se pudo iniciar sesión. Revisa tu conexión e inténtalo de nuevo.';
}
