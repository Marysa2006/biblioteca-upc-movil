/**
 * Perfil del usuario (HU-06): consultar y actualizar.
 *
 * Los datos institucionales vienen de la cuenta (no se editan). Con datos de prueba, los editables
 * se guardan aparte, por id de usuario. Con la API (módulo `sesion` de `usaApi()`), `GET /me/` y
 * `PATCH /me/` del Backend; la dirección no existe allá, así que no se envía (la pantalla la oculta).
 * Mismo patrón que src/api/servicios.ts: pantalla → hook → función → mock o API.
 */
import type { DatosEditablesPerfil, Perfil, Usuario } from '@/types';
import { CELULAR, MENSAJE_CELULAR } from '@/utils/solicitante';

import { perfilDesdeBackend, type PerfilBackend } from './backend/usuarios';
import { ErrorApi, peticion, simularRed, usaApi } from './cliente';
import { firmaEnDirectorio } from './usuarios';
import { EDITABLES_PRUEBA } from './mocks/perfil';

/**
 * Copia en memoria de los datos editables, por id de usuario: los cambios se mantienen
 * mientras la app está abierta y se pierden al recargar (solo datos de prueba).
 */
const editablesPorUsuario: Record<string, DatosEditablesPerfil> = { ...EDITABLES_PRUEBA };
const fotosPorUsuario = new Map<string, string | undefined>();

export type FotoPerfil = { uri: string; nombre: string; tipo: string; peso: number; archivo?: Blob };

export function validarFotoPerfil(foto: FotoPerfil): void {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(foto.tipo)) {
    throw new ErrorApi(400, 'Elige una foto JPG, PNG o WEBP.');
  }
  if (!Number.isFinite(foto.peso) || foto.peso <= 0) {
    throw new ErrorApi(400, 'No pudimos comprobar el tamaño de la foto.');
  }
  if (foto.peso > 5 * 1024 * 1024) {
    throw new ErrorApi(400, 'La foto debe pesar como máximo 5 MB.');
  }
}

function perfilDePrueba(usuario: Usuario): Perfil {
  const foto = fotosPorUsuario.has(usuario.id) ? fotosPorUsuario.get(usuario.id) : usuario.foto;
  return { ...usuario, ...editablesPorUsuario[usuario.id], foto, admiteFirma: true, firma: firmaEnDirectorio(usuario.id) };
}

/** ¿El perfil tiene dirección? Solo con datos de prueba: el Backend no la tiene. */
export const PERFIL_CON_DIRECCION = !usaApi('sesion');

/** Combina los datos institucionales de la sesión con los editables guardados. */
export async function obtenerPerfil(usuario: Usuario): Promise<Perfil> {
  if (!usaApi('sesion')) {
    return simularRed(perfilDePrueba(usuario));
  }
  return perfilDesdeBackend(usuario, await peticion<PerfilBackend>('/me/'));
}

/**
 * Guarda el celular que la persona dio al registrarse (#203), para que llegue prellenado a las
 * solicitudes (CA4: `datosSolicitanteDe()` lo lee del perfil). Solo lo usa el mock del registro.
 */
export function guardarCelularRegistrado(usuarioId: string, celular: string): void {
  editablesPorUsuario[usuarioId] = { ...editablesPorUsuario[usuarioId], telefono: celular };
}

export async function actualizarPerfil(
  usuario: Usuario,
  datos: DatosEditablesPerfil,
): Promise<Perfil> {
  if (!usaApi('sesion')) {
    // El teléfono es opcional: vacío es válido; solo se valida si trae texto. Misma regla que el
    // Backend: celular de 10 dígitos que empieza por 3.
    const telefono = datos.telefono?.trim();
    if (telefono && !CELULAR.test(telefono)) {
      return Promise.reject(new ErrorApi(400, MENSAJE_CELULAR));
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
    return simularRed(perfilDePrueba(usuario));
  }

  // Vacío borra el teléfono. Los demás campos que el Backend deja editar (programa, sede…) no
  // se editan desde la app.
  const perfil = await peticion<PerfilBackend>('/me/', {
    method: 'PATCH',
    body: JSON.stringify({ phone: datos.telefono ?? '' }),
  });
  return perfilDesdeBackend(usuario, perfil);
}

export async function actualizarFotoPerfil(usuario: Usuario, foto: FotoPerfil | null): Promise<Perfil> {
  if (foto) validarFotoPerfil(foto);
  if (!usaApi('sesion')) {
    fotosPorUsuario.set(usuario.id, foto?.uri);
    return simularRed(perfilDePrueba(usuario));
  }
  let body: FormData | string = JSON.stringify({ photo: null });
  if (foto) {
    const datos = new FormData();
    if (foto.archivo) datos.append('photo', foto.archivo, foto.nombre);
    else datos.append('photo', { uri: foto.uri, name: foto.nombre, type: foto.tipo } as unknown as Blob);
    body = datos;
  }
  return perfilDesdeBackend(usuario, await peticion<PerfilBackend>('/me/', { method: 'PATCH', body }));
}
