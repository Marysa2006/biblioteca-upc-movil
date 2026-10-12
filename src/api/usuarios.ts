/**
 * Usuarios y roles (HU-07).
 * Lista el directorio de usuarios y cambia el rol de uno.
 * Las rutas son provisionales: confírmenlas con el equipo de Backend.
 */
import type { Rol, Usuario } from '@/types';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { USUARIOS_DIRECTORIO } from './mocks/usuarios';

/** Copia mutable: con mocks, los cambios de rol se ven durante la sesión de la app. */
let directorio: Usuario[] = USUARIOS_DIRECTORIO.map((usuario) => ({ ...usuario }));

export function obtenerUsuarios(): Promise<Usuario[]> {
  if (USAR_MOCKS) {
    return simularRed(directorio.map((usuario) => ({ ...usuario })));
  }
  return peticion<Usuario[]>('/usuarios/');
}

export function cambiarRolUsuario(usuarioId: string, rol: Rol): Promise<Usuario> {
  if (USAR_MOCKS) {
    const indice = directorio.findIndex((usuario) => usuario.id === usuarioId);
    if (indice === -1) {
      return Promise.reject(new ErrorApi(404, 'El usuario no existe.'));
    }
    directorio = directorio.map((usuario, i) => (i === indice ? { ...usuario, rol } : usuario));
    return simularRed({ ...directorio[indice] });
  }
  return peticion<Usuario>(`/usuarios/${usuarioId}/rol/`, {
    method: 'PATCH',
    body: JSON.stringify({ rol }),
  });
}
