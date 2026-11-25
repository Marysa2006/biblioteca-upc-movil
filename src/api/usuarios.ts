/**
 * Usuarios y permisos del personal (HU-07).
 * Lista el directorio, actualiza los roles del personal de uno y le da o le quita los
 * permisos que van aparte de los roles (versión 1.1).
 * Las rutas son provisionales: confírmenlas con el equipo de Backend.
 */
import type { AceptacionPolitica, FirmaElectronica, Permiso, RolPersonal, Usuario } from '@/types';
import { NOMBRE_PERMISO, PERMISOS_ASIGNABLES, tienePermiso } from '@/utils/roles';

import { permisosExtraDesdeBackend, permisosExtraHaciaBackend } from './backend/equivalencias';
import { usuarioDirectorioDesdeBackend, type UsuarioBackend } from './backend/usuarios';
import { ErrorApi, peticion, peticionTodas, simularRed, usaApi, USAR_MOCKS } from './cliente';
import { crearNotificacion } from './notificaciones';
import { USUARIOS_DIRECTORIO } from './mocks/usuarios';

const copiar = (usuario: Usuario): Usuario => ({
  ...usuario,
  rolesPersonal: [...usuario.rolesPersonal],
  ...(usuario.permisosExtra ? { permisosExtra: [...usuario.permisosExtra] } : {}),
});

/** Copia mutable: con mocks, los cambios de roles se ven durante la sesión de la app. */
let directorio: Usuario[] = USUARIOS_DIRECTORIO.map(copiar);

export function obtenerUsuarios(rol?: RolPersonal): Promise<Usuario[]> {
  if (usaApi('usuarios')) {
    const consulta = rol ? `?role=${encodeURIComponent(rol)}` : '';
    return peticionTodas(`/users/${consulta}`, usuarioDirectorioDesdeBackend);
  }
  if (USAR_MOCKS) {
    return simularRed(directorio.filter((usuario) => !rol || usuario.rolesPersonal.includes(rol)).map(copiar));
  }
  return peticion<Usuario[]>('/usuarios/');
}

/**
 * El directorio del personal de la biblioteca (versión 1.1): solo quienes tienen algún rol.
 * Es el que usa la pantalla de permisos, y trae los `permisosExtra` de cada persona.
 */
export function obtenerEquipo(): Promise<Usuario[]> {
  if (usaApi('usuarios')) {
    return obtenerUsuarios().then((usuarios) => usuarios.filter((u) => u.rolesPersonal.length > 0));
  }
  if (USAR_MOCKS) {
    return simularRed(directorio.filter((usuario) => usuario.rolesPersonal.length > 0).map(copiar));
  }
  return peticion<Usuario[]>('/usuarios/?personal=1');
}

async function obtenerUsuarioDirectorio(id: string) {
  const usuarios = await obtenerUsuarios();
  const usuario = usuarios.find((actual) => actual.id === id);
  if (!usuario) throw new ErrorApi(404, 'El usuario no existe.');
  return usuario;
}

export async function cambiarAccesoUsuario(id: string, activo: boolean): Promise<Usuario> {
  if (!usaApi('usuarios')) {
    const usuario = await obtenerUsuarioDirectorio(id);
    const siguiente = { ...usuario, activo };
    directorio = directorio.map((actual) => actual.id === id ? siguiente : actual);
    return siguiente;
  }
  return usuarioDirectorioDesdeBackend(await peticion<UsuarioBackend>(
    `/users/${encodeURIComponent(id)}/`,
    { method: 'PATCH', body: JSON.stringify({ is_active: activo }) },
  ));
}

type RolBackend = { id: number; code: string; is_active: boolean };
type RolAsignadoBackend = { role: Pick<RolBackend, 'id' | 'code'> };

async function actualizarRolesBackend(usuarioId: string, roles: RolPersonal[]) {
  const ruta = `/users/${encodeURIComponent(usuarioId)}/roles/`;
  const actuales = await peticion<RolAsignadoBackend[]>(ruta);
  const codigos = new Set(actuales.map(({ role }) => role.code));
  const deseaAdmin = roles.includes('administrador');
  if (codigos.has('administrador') !== deseaAdmin) {
    throw new ErrorApi(400, 'La administración de la biblioteca se cambia desde el Backend.');
  }
  const solicitados = new Set<string>(roles);
  const faltantes = [...solicitados].filter((codigo) => !codigos.has(codigo));
  if (faltantes.length) {
    const catalogo = await peticionTodas<RolBackend, RolBackend>('/roles/', (rol) => rol);
    const nuevos = faltantes.map((codigo) => {
      const rol = catalogo.find((actual) => actual.code === codigo && actual.is_active);
      if (!rol) throw new ErrorApi(400, `El rol ${codigo} no está disponible.`);
      return rol;
    });
    for (const rol of nuevos) {
      await peticion(ruta, { method: 'POST', body: JSON.stringify({ role: rol.id }) });
    }
  }
  for (const { role } of actuales) {
    if ((role.code === 'facilitador' || role.code === 'gestor_espacios') && !solicitados.has(role.code)) {
      await peticion(`${ruta}${role.id}/`, { method: 'DELETE' });
    }
  }
  return obtenerUsuarioDirectorio(usuarioId);
}

/**
 * Busca a una persona por su correo en el directorio que mutan los roles y los permisos
 * (versión 1.1). El login de prueba la usa para no leer una foto fija: si la administración
 * le cambia el rol o le da `novedades`, lo ve al volver a entrar (#256, CA1).
 *
 * Devuelve una copia, para que nadie cambie el directorio desde fuera.
 */
export function buscarEnDirectorio(correo: string): Usuario | undefined {
  const buscado = correo.trim().toLowerCase();
  const encontrado = directorio.find(
    (usuario) => usuario.correo.trim().toLowerCase() === buscado,
  );
  return encontrado ? copiar(encontrado) : undefined;
}

/** ¿Ya hay alguien con esa cédula en el directorio? Lo usa el registro de prueba (#203). */
export function existeIdentificacion(identificacion: string): boolean {
  const buscada = identificacion.trim();
  return directorio.some((usuario) => usuario.identificacion?.trim() === buscada);
}

/**
 * Agrega una cuenta nueva de la comunidad al directorio de prueba (#203). Solo lo usa el mock del
 * registro; con la API real, la cuenta la crea el Backend. Se pierde al recargar la app.
 */
export function agregarAlDirectorio(usuario: Usuario): void {
  directorio = [...directorio, copiar(usuario)];
}

/**
 * Guarda la firma en el directorio de prueba. El perfil del Backend aún no admite la firma.
 */
export async function guardarFirmaPersonal(
  usuarioId: string,
  firma: FirmaElectronica | null,
): Promise<void> {
  if (!usaApi('sesion')) {
    directorio = directorio.map((usuario) => {
      if (usuario.id !== usuarioId) return usuario;
      const { firma: _anterior, ...resto } = usuario;
      return firma ? { ...resto, firma: { ...firma } } : resto;
    });
    await simularRed(null);
    return;
  }
  throw new ErrorApi(400, 'El perfil conectado todavía no permite guardar la firma del personal.');
}

/** La firma registrada de una persona del directorio de prueba, para las constancias. */
export function firmaEnDirectorio(usuarioId: string): FirmaElectronica | undefined {
  return directorio.find((usuario) => usuario.id === usuarioId)?.firma;
}

/**
 * Guarda en el directorio de prueba que la persona aceptó la autorización de datos (revisión de
 * la 1.1). Solo lo usa el mock; con la API real, lo guarda el Backend.
 */
export function guardarAceptacionEnDirectorio(
  usuarioId: string,
  aceptacion: AceptacionPolitica,
): void {
  directorio = directorio.map((usuario) =>
    usuario.id === usuarioId ? { ...usuario, aceptacionDatos: { ...aceptacion } } : usuario,
  );
}

/**
 * Da o quita los permisos que van aparte de los roles (versión 1.1, #256 y #296): novedades,
 * fotos de Inicio y parámetros, que la administración encarga a quien quiera del personal.
 *
 * Solo puede hacerlo quien tenga el permiso `roles` (la administración); el resto recibe 403.
 * Solo se aceptan los de `PERMISOS_ASIGNABLES`; cualquier otro, 400. Tampoco se dan a una cuenta
 * sin roles del personal (400): no entraría a la vista donde se usan.
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

  if (usaApi('usuarios')) {
    const ruta = `/users/${encodeURIComponent(usuarioId)}/permissions/`;
    return obtenerUsuarioDirectorio(usuarioId).then(async (persona) => {
      const respuesta = await peticion<{ permissions?: string[]; extra_permissions?: string[] }>(ruta, {
        method: 'PUT',
        body: JSON.stringify({ permissions: permisosExtraHaciaBackend(permisos) }),
      });
      return {
        ...persona,
        permisosExtra: permisosExtraDesdeBackend(respuesta.permissions ?? respuesta.extra_permissions ?? []),
      };
    });
  }

  if (USAR_MOCKS) {
    const indice = directorio.findIndex((actual) => actual.id === usuarioId);
    if (indice === -1) {
      return Promise.reject(new ErrorApi(404, 'El usuario no existe.'));
    }
    const anterior = directorio[indice];
    if (permisos.length > 0 && anterior.rolesPersonal.length === 0) {
      return Promise.reject(
        new ErrorApi(
          400,
          'Primero asígnale un rol del personal: sin él, los permisos adicionales no le sirven.',
        ),
      );
    }
    const siguiente: Usuario = {
      ...anterior,
      permisosExtra: permisos.length > 0 ? [...permisos] : undefined,
    };
    directorio = directorio.map((actual, i) => (i === indice ? siguiente : actual));

    // Solo se avisa de los que son nuevos para la persona.
    const nuevos = permisos.filter((permiso) => !anterior.permisosExtra?.includes(permiso));
    if (nuevos.length > 0) {
      crearNotificacion({
        usuarioId,
        // No nace de una solicitud: es el aviso de un permiso nuevo. El campo es obligatorio
        // en el tipo, así que va vacío y la pantalla lo ignora.
        solicitudId: '',
        titulo: 'Nuevos permisos',
        mensaje: `Ahora tienes ${nuevos.length === 1 ? 'el permiso' : 'los permisos'}: ${nuevos
          .map((permiso) => NOMBRE_PERMISO[permiso])
          .join(', ')}.`,
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
  if (usaApi('usuarios')) return actualizarRolesBackend(usuarioId, rolesPersonal);
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
