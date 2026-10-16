/**
 * Perfil del usuario (HU-06).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 */

import type { Usuario } from './usuarios';

/** Datos que el usuario completa o actualiza; no vienen de la cuenta institucional (HU-06). */
export type DatosEditablesPerfil = {
  telefono?: string;
  /**
   * Dirección: PROVISIONAL. No está en el esquema del Backend (`core_user`); se confirma
   * con la biblioteca y el equipo de Backend antes de conectar la API real.
   */
  direccion?: string;
};

/**
 * Perfil del usuario autenticado (HU-06): datos institucionales de solo lectura
 * más los datos editables.
 */
export type Perfil = Usuario & DatosEditablesPerfil;
