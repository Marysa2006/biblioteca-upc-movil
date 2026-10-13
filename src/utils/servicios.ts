/**
 * Categorías de servicio (HU-01): nombre visible, ícono y agrupación.
 * Funciones puras, sin hooks.
 */
import type { CategoriaServicio, Servicio } from '@/types';

type InfoCategoria = {
  nombre: string;
  icono: string;
  /** Descripción corta, para la tarjeta de Inicio. */
  descripcion: string;
  /** Texto que encabeza las opciones en Servicios, para categorías con varios servicios. */
  presentacion?: string;
};

/** Orden en que aparecen las categorías en Inicio y en Servicios. */
export const ORDEN_CATEGORIAS: CategoriaServicio[] = [
  'asesorias',
  'capacitaciones',
  'espacios',
  'repositorio',
  'tablets',
  'prestamo',
];

/** Categorías destacadas en Inicio (las del mockup), en este orden. Las demás, en "Ver todos". */
export const CATEGORIAS_INICIO: CategoriaServicio[] = [
  'asesorias',
  'capacitaciones',
  'espacios',
  'repositorio',
];

export const CATEGORIAS_SERVICIO: Record<CategoriaServicio, InfoCategoria> = {
  asesorias: {
    nombre: 'Asesorías',
    icono: 'head-cog-outline',
    descripcion: 'Normas APA, Mendeley y búsqueda especializada.',
  },
  capacitaciones: {
    nombre: 'Capacitaciones',
    icono: 'account-group-outline',
    descripcion: 'Talleres de búsqueda y manejo de información.',
  },
  espacios: {
    nombre: 'Espacios',
    icono: 'office-building-outline',
    descripcion: 'Salas de estudio grupal y cubículos.',
  },
  repositorio: {
    nombre: 'Repositorio institucional',
    icono: 'book-open-variant',
    descripcion: 'Depósito y consulta de trabajos de grado.',
  },
  tablets: {
    nombre: 'Préstamo de tablets',
    icono: 'tablet-cellphone',
    descripcion: 'Tablets para usar dentro de la biblioteca.',
  },
  // Provisional: la bibliotecóloga indica que los préstamos se gestionan en Koha.
  prestamo: {
    nombre: 'Préstamo de libros',
    icono: 'book-arrow-right-outline',
    descripcion: 'Préstamo de material y hemeroteca.',
    presentacion:
      'Préstamo de libros y material bibliográfico, y consulta de la hemeroteca. Elige el servicio para ver su público, horarios y cómo solicitarlo.',
  },
};

export type GrupoServicios = { categoria: CategoriaServicio; servicios: Servicio[] };

/**
 * Deja solo los servicios activos y los agrupa por categoría, sin grupos vacíos.
 * El mock ya excluye los inactivos, pero la API real quizás no.
 */
export function agruparServiciosActivos(servicios: Servicio[]): GrupoServicios[] {
  const activos = servicios.filter((servicio) => servicio.activo);
  return ORDEN_CATEGORIAS.map((categoria) => ({
    categoria,
    servicios: activos.filter((servicio) => servicio.categoria === categoria),
  })).filter((grupo) => grupo.servicios.length > 0);
}
