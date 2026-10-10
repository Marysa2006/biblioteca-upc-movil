/**
 * USUARIOS DE PRUEBA para el inicio de sesión provisional.
 * Sirven para ver la app con cada rol mientras no exista el login institucional (HU-05).
 */
import type { Usuario } from '@/types';

export const USUARIOS_PRUEBA: Usuario[] = [
  {
    id: 'u-estudiante',
    nombre: 'Laura Pérez',
    correo: 'laura.perez@unicesar.edu.co',
    rol: 'estudiante',
    programa: 'Enfermería',
    semestre: 8,
  },
  {
    id: 'u-docente',
    nombre: 'Carlos Ramírez',
    correo: 'carlos.ramirez@unicesar.edu.co',
    rol: 'docente',
    programa: 'Ingeniería de Sistemas',
  },
  {
    id: 'u-administrador',
    nombre: 'Ana Torres',
    correo: 'ana.torres@unicesar.edu.co',
    rol: 'administrador',
  },
  {
    id: 'u-facilitador',
    nombre: 'Julián Mendoza',
    correo: 'julian.mendoza@unicesar.edu.co',
    rol: 'facilitador',
  },
];

export const TOKEN_PRUEBA = 'token-de-prueba';
