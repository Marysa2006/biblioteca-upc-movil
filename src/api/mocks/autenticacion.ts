/**
 * DATOS DE PRUEBA del inicio de sesión provisional (HU-05).
 * Los usuarios que pueden entrar son USUARIOS_PRUEBA (./usuarios); aquí solo va
 * lo que necesita el login para probar los criterios de aceptación.
 */
import type { Usuario } from '@/types';

/** Contraseña común de los usuarios de prueba. Permite probar CA2 (credenciales inválidas). */
export const CONTRASENA_PRUEBA = 'biblioteca123';

/**
 * Cuenta inactiva de prueba (CA3).
 * Va en una lista aparte para que NO aparezca en los botones del login provisional actual.
 */
export const USUARIOS_INACTIVOS_PRUEBA: Usuario[] = [
  {
    id: 'u-inactivo',
    nombre: 'Pedro Gómez',
    correo: 'pedro.gomez@unicesar.edu.co',
    tipo: 'estudiante',
    rolesPersonal: [],
    programa: 'Ingeniería Ambiental',
    semestre: 3,
  },
];
