/**
 * Perfil del usuario (HU-06): consultar y actualizar.
 *
 * Los datos institucionales vienen de la sesión (no se editan); los editables se
 * guardan aparte, por id de usuario.
 * Mismo patrón que src/api/servicios.ts: pantalla → hook → función → mock.
 *
 * La ruta '/perfil/' es provisional: confírmenla con el equipo de Backend.
 */
import type { DatosEditablesPerfil, Perfil, Usuario } from '@/types';

import { ErrorApi, peticion, simularRed, USAR_MOCKS } from './cliente';
import { EDITABLES_PRUEBA } from './mocks/perfil';

/**
 * Copia en memoria de los datos editables, por id de usuario: los cambios se mantienen
 * mientras la app está abierta y se pierden al recargar (provisional hasta la API real).
 */
const editablesPorUsuario: Record<string, DatosEditablesPerfil> = { ...EDITABLES_PRUEBA };

/** Teléfono válido: solo dígitos, entre 7 y 10. */
const TELEFONO_VALIDO = /^[0-9]{7,10}$/;

/** Combina los datos institucionales de la sesión con los editables guardados. */
export function obtenerPerfil(usuario: Usuario): Promise<Perfil> {
  if (USAR_MOCKS) {
    return simularRed({ ...usuario, ...editablesPorUsuario[usuario.id] });
  }
  return peticion<Perfil>('/perfil/');
}

export function actualizarPerfil(
  usuario: Usuario,
  datos: DatosEditablesPerfil,
): Promise<Perfil> {
  if (USAR_MOCKS) {
    // El teléfono es opcional: vacío es válido; solo se valida si trae texto.
    const telefono = datos.telefono?.trim();
    if (telefono && !TELEFONO_VALIDO.test(telefono)) {
      return Promise.reject(
        new ErrorApi(400, 'El teléfono debe tener entre 7 y 10 dígitos, sin espacios ni letras.'),
      );
    }

    // Solo se reemplazan los campos que vienen en "datos"; el resto se conserva.
    const guardados = { ...editablesPorUsuario[usuario.id] };
    if (datos.telefono !== undefined) {
      guardados.telefono = telefono;
    }
    if (datos.direccion !== undefined) {
      guardados.direccion = datos.direccion;
    }
    editablesPorUsuario[usuario.id] = guardados;
    return simularRed({ ...usuario, ...guardados });
  }

  return peticion<Perfil>('/perfil/', { method: 'PATCH', body: JSON.stringify(datos) });
}
