/**
 * El usuario del Backend traducido al `Usuario` de la app (HU-05, HU-06 y HU-07).
 * Funciones puras: las usan src/api/autenticacion.ts y src/api/perfil.ts.
 *
 * - `GET /me/` trae los datos de la persona (`PerfilBackend`).
 * - `GET /me/access/` trae sus roles y permisos (`AccesoBackend`).
 */
import type { Perfil, Usuario } from '@/types';
import { VERSION_POLITICA_DATOS } from '@/utils/constantes';

import {
  permisosExtraDesdeBackend,
  rolesDesdeBackend,
  sedeDesdeBackend,
  TIPO_DESDE_BACKEND,
  type TipoUsuarioBackend,
} from './equivalencias';

/** `GET /me/` (`Profile` en el esquema 2.1.0). */
export type PerfilBackend = {
  id: string;
  institutional_id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: TipoUsuarioBackend;
  program: string;
  department: string;
  /** Texto: «7» o un periodo como «2026-1». */
  semester: string;
  phone: string;
  campus: string;
  faculty: string;
  position: string;
  photo: string | null;
  is_active: boolean;
  privacy_accepted_at: string | null;
  privacy_version: string;
  privacy_acceptance_required: boolean;
};

/** `GET /me/access/`. */
export type AccesoBackend = {
  roles: string[];
  permissions: string[];
  extra_permissions: string[];
  is_superuser: boolean;
};

/** Texto vacío del Backend → undefined, como en los datos de prueba. */
const opcional = (texto: string | null | undefined) => (texto?.trim() ? texto.trim() : undefined);

/** El semestre como número, si lo es («7»); un periodo («2026-1») no se muestra como semestre. */
function semestreDesdeBackend(semestre: string): number | undefined {
  return /^\d{1,2}$/.test(semestre.trim()) ? Number(semestre) : undefined;
}

/** Los datos de la persona, sin roles ni permisos. */
export function datosPersonalesDesdeBackend(
  perfil: PerfilBackend,
): Omit<Usuario, 'rolesPersonal' | 'permisosExtra'> {
  return {
    id: perfil.id,
    nombre: `${perfil.first_name} ${perfil.last_name}`.trim() || perfil.email,
    correo: perfil.email,
    tipo: TIPO_DESDE_BACKEND[perfil.user_type],
    identificacion: opcional(perfil.institutional_id),
    programa: opcional(perfil.program),
    semestre: semestreDesdeBackend(perfil.semester),
    facultad: opcional(perfil.faculty),
    sede: sedeDesdeBackend(perfil.campus),
    dependencia: opcional(perfil.department),
    cargo: opcional(perfil.position),
    // La app compara la versión aceptada con VERSION_POLITICA_DATOS. El Backend ya decide si hace
    // falta aceptar otra vez (`privacy_acceptance_required`), así que si no hace falta, la
    // aceptación cuenta como la vigente; si hace falta, la app la pide.
    ...(!perfil.privacy_acceptance_required && perfil.privacy_accepted_at
      ? { aceptacionDatos: { version: VERSION_POLITICA_DATOS, fecha: perfil.privacy_accepted_at } }
      : {}),
  };
}

/**
 * El usuario de la sesión. Quien es superusuario del Backend puede hacer todo allá, así que en la
 * app cuenta como `administrador` aunque no tenga el rol.
 */
export function usuarioDesdeBackend(perfil: PerfilBackend, acceso: AccesoBackend): Usuario {
  const roles = rolesDesdeBackend(acceso.roles);
  if (acceso.is_superuser && !roles.includes('administrador')) roles.unshift('administrador');
  const permisosExtra = permisosExtraDesdeBackend(acceso.extra_permissions);
  return {
    ...datosPersonalesDesdeBackend(perfil),
    rolesPersonal: roles,
    ...(permisosExtra.length > 0 ? { permisosExtra } : {}),
  };
}

/**
 * El perfil (HU-06): el usuario de la sesión, que conserva sus roles, con los datos al día del
 * Backend y su teléfono. La dirección no existe en el Backend: no se llena.
 */
export function perfilDesdeBackend(usuario: Usuario, perfil: PerfilBackend): Perfil {
  return {
    ...usuario,
    ...datosPersonalesDesdeBackend(perfil),
    telefono: opcional(perfil.phone),
  };
}

export type UsuarioBackend = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  institutional_id: string;
  user_type: TipoUsuarioBackend;
  is_active?: boolean;
  roles: string[];
  extra_permissions: string[];
};

export function usuarioDirectorioDesdeBackend(usuario: UsuarioBackend): Usuario {
  return {
    id: usuario.id,
    nombre: [usuario.first_name, usuario.last_name].filter(Boolean).join(' ') || usuario.email,
    correo: usuario.email,
    identificacion: usuario.institutional_id || undefined,
    tipo: TIPO_DESDE_BACKEND[usuario.user_type],
    rolesPersonal: rolesDesdeBackend(usuario.roles),
    permisosExtra: permisosExtraDesdeBackend(usuario.extra_permissions),
    activo: usuario.is_active ?? true,
  };
}
