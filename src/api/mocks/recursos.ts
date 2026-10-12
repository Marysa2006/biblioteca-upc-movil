/**
 * DATOS DE PRUEBA de los recursos académicos (HU-03).
 *
 * Son bases de datos conocidas, usadas como ejemplo para probar la pantalla.
 * La lista definitiva se confirma con la biblioteca.
 *
 * OJO con el término: no todas son "suscritas".
 *   - De acceso abierto (requiereCuenta: false): SciELO, Redalyc y Dialnet.
 *   - Con suscripción / cuenta institucional (requiereCuenta: true): ScienceDirect,
 *     Scopus, EBSCO y JSTOR. Estas permiten probar CA3.
 */
import type { Recurso } from '@/types';

export const RECURSOS: Recurso[] = [
  {
    id: 'scielo',
    nombre: 'SciELO',
    descripcion: 'Biblioteca electrónica de acceso abierto con revistas científicas de América Latina.',
    url: 'https://www.scielo.org/',
    requiereCuenta: false,
  },
  {
    id: 'redalyc',
    nombre: 'Redalyc',
    descripcion: 'Red de revistas científicas de América Latina y el Caribe, de acceso abierto.',
    url: 'https://www.redalyc.org/',
    requiereCuenta: false,
  },
  {
    id: 'dialnet',
    nombre: 'Dialnet',
    descripcion: 'Portal de difusión de la producción científica hispana.',
    url: 'https://dialnet.unirioja.es/',
    requiereCuenta: false,
  },
  {
    id: 'sciencedirect',
    nombre: 'ScienceDirect',
    descripcion: 'Artículos y libros de la editorial Elsevier (requiere suscripción).',
    url: 'https://www.sciencedirect.com/',
    requiereCuenta: true,
  },
  {
    id: 'scopus',
    nombre: 'Scopus',
    descripcion: 'Base de datos bibliográfica de resúmenes y citas (requiere suscripción).',
    url: 'https://www.scopus.com/',
    requiereCuenta: true,
  },
  {
    id: 'ebsco',
    nombre: 'EBSCO',
    descripcion: 'Bases de datos multidisciplinarias de revistas académicas (requiere suscripción).',
    url: 'https://www.ebsco.com/',
    requiereCuenta: true,
  },
  {
    id: 'jstor',
    nombre: 'JSTOR',
    descripcion: 'Colección de revistas académicas y libros (requiere suscripción).',
    url: 'https://www.jstor.org/',
    requiereCuenta: true,
  },
];
