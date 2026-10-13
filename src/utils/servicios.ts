/**
 * Categorías de servicio (HU-01): nombre visible, ícono y agrupación.
 * Funciones puras, sin hooks.
 */
import type { CategoriaServicio, Servicio } from '@/types';

type InfoCategoria = { nombre: string; icono: string };

/** Orden en que aparecen las categorías en Inicio. */
export const ORDEN_CATEGORIAS: CategoriaServicio[] = [
  'asesorias',
  'capacitaciones',
  'espacios',
  'repositorio',
  'tablets',
  'prestamo',
];

export const CATEGORIAS_SERVICIO: Record<CategoriaServicio, InfoCategoria> = {
  asesorias: { nombre: 'Asesorías', icono: 'head-cog-outline' },
  capacitaciones: { nombre: 'Capacitaciones', icono: 'account-group-outline' },
  espacios: { nombre: 'Espacios', icono: 'office-building-outline' },
  repositorio: { nombre: 'Repositorio institucional', icono: 'book-open-variant' },
  tablets: { nombre: 'Préstamo de tablets', icono: 'tablet-cellphone' },
  // Provisional: la bibliotecóloga indica que los préstamos se gestionan en Koha.
  prestamo: { nombre: 'Préstamo de libros', icono: 'book-arrow-right-outline' },
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
