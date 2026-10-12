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

import { iniciarSesionApi, type CredencialesLogin } from '@/api/autenticacion';
import { ErrorApi } from '@/api/cliente';
import { useSesion } from '@/store/sesion';

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
