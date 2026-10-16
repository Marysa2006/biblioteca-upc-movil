/**
 * Usuarios y roles del personal (HU-07).
 * Lista el directorio de usuarios y actualiza los roles del personal de uno.
 * Las rutas son provisionales: confírmenlas con el equipo de Backend.
 */
import type { RolPersonal, Usuario } from '@/types';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { USUARIOS_DIRECTORIO } from './mocks/usuarios';

const copiar = (usuario: Usuario): Usuario => ({
  ...usuario,
  rolesPersonal: [...usuario.rolesPersonal],
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
