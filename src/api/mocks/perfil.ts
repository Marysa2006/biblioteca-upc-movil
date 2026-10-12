/**
 * DATOS DE PRUEBA del perfil de usuario (HU-06).
 *
 * Los datos institucionales (nombre, correo, rol, programa, semestre) NO van aquí:
 * salen de la sesión. Aquí solo se guardan los datos EDITABLES, por id de usuario.
 */
import type { DatosEditablesPerfil } from '@/types';

/** Datos editables de prueba, por id de usuario. */
export const EDITABLES_PRUEBA: Record<string, DatosEditablesPerfil> = {
  'u-estudiante': { telefono: '3001234567', direccion: 'Valledupar, Cesar' },
  'u-docente': { telefono: '3109876543', direccion: '' },
};
