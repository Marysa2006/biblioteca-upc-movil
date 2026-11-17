/**
 * Usuarios y permisos del personal (HU-07).
 * Lista el directorio, actualiza los roles del personal de uno y le da o le quita los
 * permisos que van aparte de los roles (versión 1.1).
 * Las rutas son provisionales: confírmenlas con el equipo de Backend.
 */
import type { Permiso, RolPersonal, Usuario } from '@/types';
import { PERMISOS_ASIGNABLES, tienePermiso } from '@/utils/roles';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { crearNotificacion } from './notificaciones';
import { USUARIOS_DIRECTORIO } from './mocks/usuarios';

const copiar = (usuario: Usuario): Usuario => ({
  ...usuario,
  rolesPersonal: [...usuario.rolesPersonal],
  ...(usuario.permisosExtra ? { permisosExtra: [...usuario.permisosExtra] } : {}),
});

/** Copia mutable: con mocks, los cambios de roles se ven durante la sesión de la app. */
let directorio: Usuario[] = USUARIOS_DIRECTORIO.map(copiar);

export function obtenerUsuarios(): Promise<Usuario[]> {
  if (USAR_MOCKS) {
    return simularRed(directorio.map(copiar));
  }
  return peticion<Usuario[]>('/usuarios/');
}

/**
 * El directorio del personal de la biblioteca (versión 1.1): solo quienes tienen algún rol.
 * Es el que usa la pantalla de permisos, y trae los `permisosExtra` de cada persona.
 */
export function obtenerEquipo(): Promise<Usuario[]> {
  if (USAR_MOCKS) {
    return simularRed(directorio.filter((usuario) => usuario.rolesPersonal.length > 0).map(copiar));
  }
  return peticion<Usuario[]>('/usuarios/?personal=1');
}

/**
 * Da o quita los permisos que van aparte de los roles (versión 1.1, #256).
 * No es un rol nuevo: es el `novedades` que la administración le concede a una persona.
 *
 * Solo puede hacerlo quien tenga el permiso `roles` (la administración); el resto recibe 403.
 * Solo se aceptan los de `PERMISOS_ASIGNABLES`; cualquier otro, 400.
 */
export function actualizarPermisosExtra(
  usuario: Usuario,
  usuarioId: string,
  permisos: Permiso[],
): Promise<Usuario> {
  if (!tienePermiso(usuario, 'roles')) {
    return Promise.reject(new ErrorApi(403, 'Solo la administración puede dar permisos.'));
  }
  const desconocidos = permisos.filter(
    (permiso) => !(PERMISOS_ASIGNABLES as readonly Permiso[]).includes(permiso),
  );
  if (desconocidos.length > 0) {
    return Promise.reject(
      new ErrorApi(400, `Ese permiso no se asigna desde aquí: ${desconocidos.join(', ')}.`),
    );
  }

  if (USAR_MOCKS) {
    const indice = directorio.findIndex((actual) => actual.id === usuarioId);
    if (indice === -1) {
      return Promise.reject(new ErrorApi(404, 'El usuario no existe.'));
    }
    const anterior = directorio[indice];
    const siguiente: Usuario = {
      ...anterior,
      permisosExtra: permisos.length > 0 ? [...permisos] : undefined,
    };
    directorio = directorio.map((actual, i) => (i === indice ? siguiente : actual));

    if (permisos.length > 0) {
      crearNotificacion({
        usuarioId,
        // No nace de una solicitud: es el aviso de un permiso nuevo. El campo es obligatorio
        // en el tipo, así que va vacío y la pantalla lo ignora.
        solicitudId: '',
        titulo: 'Nuevos permisos',
        mensaje: 'Ahora puedes publicar novedades y avisos.',
      });
    }
    return simularRed(copiar(siguiente));
  }
  return peticion<Usuario>(`/usuarios/${usuarioId}/permisos/`, {
    method: 'PUT',
    body: JSON.stringify({ permisosExtra: permisos }),
  });
}

/**
 * Reemplaza los roles del personal de un usuario (HU-07). Una lista vacía le retira
 * todos los roles: sigue siendo de la comunidad con su tipo de usuario.
 */
export function actualizarRolesPersonal(
  usuarioId: string,
  rolesPersonal: RolPersonal[],
): Promise<Usuario> {
  if (USAR_MOCKS) {
    const indice = directorio.findIndex((usuario) => usuario.id === usuarioId);
    if (indice === -1) {
      return Promise.reject(new ErrorApi(404, 'El usuario no existe.'));
    }
    directorio = directorio.map((usuario, i) =>
      i === indice ? { ...usuario, rolesPersonal: [...rolesPersonal] } : usuario,
    );
    return simularRed(copiar(directorio[indice]));
  }
  return peticion<Usuario>(`/usuarios/${usuarioId}/roles/`, {
    method: 'PUT',
    body: JSON.stringify({ rolesPersonal }),
  });
}
