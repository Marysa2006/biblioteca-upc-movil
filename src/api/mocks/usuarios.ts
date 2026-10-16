/**
 * USUARIOS DE PRUEBA para el inicio de sesión provisional.
 * Sirven para ver la app con cada tipo de usuario y rol del personal mientras no exista el
 * login institucional (HU-05). Todos entran con la contraseña biblioteca123.
 */
import type { Usuario } from '@/types';

export const USUARIOS_PRUEBA: Usuario[] = [
  {
    id: 'u-estudiante',
    nombre: 'Laura Pérez',
    correo: 'laura.perez@unicesar.edu.co',
    tipo: 'estudiante',
    rolesPersonal: [],
    programa: 'Enfermería',
    semestre: 8,
  },
  {
    id: 'u-docente',
    nombre: 'Carlos Ramírez',
    correo: 'carlos.ramirez@unicesar.edu.co',
    tipo: 'docente',
    rolesPersonal: [],
    programa: 'Ingeniería de Sistemas',
  },
  {
    id: 'u-administrador',
    nombre: 'Ana Torres',
    correo: 'ana.torres@unicesar.edu.co',
    tipo: 'administrativo',
    rolesPersonal: ['administrador'],
  },
  {
    id: 'u-facilitador',
    nombre: 'Julián Mendoza',
    correo: 'julian.mendoza@unicesar.edu.co',
    tipo: 'administrativo',
    rolesPersonal: ['facilitador'],
  },
  {
    id: 'u-gestor-espacios',
    nombre: 'Sofía Vargas',
    correo: 'sofia.vargas@unicesar.edu.co',
    tipo: 'administrativo',
    rolesPersonal: ['gestor_espacios'],
  },
  {
    id: 'u-encargado-tablets',
    nombre: 'Mateo Castro',
    correo: 'mateo.castro@unicesar.edu.co',
    tipo: 'administrativo',
    rolesPersonal: ['encargado_tablets'],
  },
];

export const TOKEN_PRUEBA = 'token-de-prueba';

/**
 * DIRECTORIO DE USUARIOS para la pantalla de roles (HU-07).
 * Arranca con los seis usuarios de prueba y suma otros para tener varios roles
 * a la vista. Es la semilla del mock: src/api/usuarios.ts trabaja sobre una copia.
 */
export const USUARIOS_DIRECTORIO: Usuario[] = [
  ...USUARIOS_PRUEBA,
  {
    id: 'u-administrativo',
    nombre: 'Diana Ospina',
    correo: 'diana.ospina@unicesar.edu.co',
    tipo: 'administrativo',
    rolesPersonal: [],
    programa: 'Secretaría Académica',
  },
  {
    id: 'u-estudiante-2',
    nombre: 'Andrés Mejía',
    correo: 'andres.mejia@unicesar.edu.co',
    tipo: 'estudiante',
    rolesPersonal: [],
    programa: 'Ingeniería Ambiental',
    semestre: 5,
  },
  {
    id: 'u-facilitador-2',
    nombre: 'Paula Rincón',
    correo: 'paula.rincon@unicesar.edu.co',
    tipo: 'administrativo',
    rolesPersonal: ['facilitador'],
  },
];
