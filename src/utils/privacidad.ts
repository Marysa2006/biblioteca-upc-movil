/**
 * Autorización de tratamiento de datos personales (#225). Funciones puras, sin hooks ni
 * almacenamiento: la sesión guardada las usa desde src/store/sesion.ts y así se pueden probar
 * sin el celular.
 *
 * El texto legal es el Acuerdo 019 del 5 de octubre de 2020 de la UPC (Ley 1581 de 2012).
 */
import type { AceptacionPolitica, Usuario } from '@/types';

import { VERSION_POLITICA_DATOS } from './constantes';
import { MESES } from './fechas';

/**
 * Autorización aceptada: qué política y cuándo. Guardar el momento de la aceptación es lo que
 * permite responder a la solicitud de prueba de la autorización, que la política reconoce como
 * derecho del titular (sección 7, literal b). Es `AceptacionPolitica` de los tipos.
 */
export type AceptacionDatos = AceptacionPolitica;

export type Aceptaciones = Record<string, AceptacionDatos>;

/**
 * ¿Esta persona ya aceptó la política vigente? Si la Universidad publica otra política (cambia
 * VERSION_POLITICA_DATOS), vuelve a ser false y se le pide otra vez.
 */
export function aceptoPoliticaVigente(
  aceptaciones: Aceptaciones,
  usuarioId: string | undefined,
): boolean {
  if (!usuarioId) return false;
  return aceptaciones[usuarioId]?.version === VERSION_POLITICA_DATOS;
}

/**
 * La autorización vigente de la persona, o null si no la tiene (revisión de la 1.1). Vale la que
 * trae el usuario (la aceptó al registrarse; con la API, la del Backend) o, si la Universidad
 * publicó otra política y la aceptó en este celular, la guardada en la sesión. Así quien ya se
 * registró no la vuelve a ver al iniciar sesión, en este ni en otro celular.
 */
export function aceptacionVigente(
  usuario: Pick<Usuario, 'id' | 'aceptacionDatos'> | null | undefined,
  aceptaciones: Aceptaciones,
): AceptacionDatos | null {
  if (!usuario) return null;
  if (usuario.aceptacionDatos?.version === VERSION_POLITICA_DATOS) return usuario.aceptacionDatos;
  return aceptoPoliticaVigente(aceptaciones, usuario.id) ? aceptaciones[usuario.id] : null;
}

/** Lo que se guarda al aceptar: la política vigente y el momento. */
export function nuevaAceptacion(ahora: Date = new Date()): AceptacionDatos {
  return { version: VERSION_POLITICA_DATOS, fecha: ahora.toISOString() };
}

/** "2026-11-16T10:00:00.000Z" → "16 de noviembre de 2026", en la hora del celular. */
export function fechaDeAceptacion(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

/** Descarta aceptaciones con forma inválida: lo guardado pudo escribirlo una versión anterior. */
function aceptacionesValidas(valor: unknown): Aceptaciones {
  if (!valor || typeof valor !== 'object') return {};
  const validas: Aceptaciones = {};
  for (const [id, dato] of Object.entries(valor as Record<string, unknown>)) {
    const aceptacion = dato as Partial<AceptacionDatos> | null;
    if (typeof aceptacion?.version === 'string' && typeof aceptacion?.fecha === 'string') {
      validas[id] = { version: aceptacion.version, fecha: aceptacion.fecha };
    }
  }
  return validas;
}

type SesionGuardada = { usuario: Usuario | null; token: string | null; refresh: string | null };
type ResultadoMigracion = SesionGuardada & { aceptaciones: Aceptaciones };

/**
 * Migración de una sesión guardada con otra versión del store (#225).
 *
 * - Versión 3: la sesión se conserva sin `refresh` (con datos de prueba no hace falta). Con la
 *   API real, el primer 401 no puede renovar el token y la persona vuelve a iniciar sesión.
 * - Versión 2 (la última antes de este cambio): el usuario ya tiene la forma actual (`tipo` y
 *   `rolesPersonal`), así que la sesión se conserva y solo se le añaden las aceptaciones. Al
 *   abrir, la app pide la autorización antes de dejar usar nada con cuenta.
 * - Versión 1 o anterior: el usuario guardado tiene la forma vieja (un solo `rol`), así que se
 *   descarta la sesión y se vuelve a iniciar sesión, como ya hacía la versión 2.
 */
export function migrarSesionGuardada(
  guardado: unknown,
  versionGuardada: number,
): ResultadoMigracion {
  const anterior = (guardado ?? {}) as Partial<SesionGuardada> & { aceptaciones?: unknown };
  const aceptaciones = aceptacionesValidas(anterior.aceptaciones);

  const usuario = anterior.usuario;
  const sesionSirve =
    versionGuardada >= 2 &&
    usuario != null &&
    typeof usuario === 'object' &&
    typeof usuario.id === 'string' &&
    typeof anterior.token === 'string';

  if (!sesionSirve) return { usuario: null, token: null, refresh: null, aceptaciones };
  return {
    usuario: usuario as Usuario,
    token: anterior.token as string,
    refresh: typeof anterior.refresh === 'string' ? anterior.refresh : null,
    aceptaciones,
  };
}
