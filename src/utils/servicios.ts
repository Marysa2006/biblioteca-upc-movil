/**
 * Categorías de servicio (HU-01): nombre visible, ícono y agrupación; validación del formulario (HU-04).
 * Funciones puras, sin hooks.
 */
import { z } from 'zod';

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

const texto = (campo: string, maximo: number) =>
  z
    .string()
    .trim()
    .min(1, { error: `Escribe ${campo}.` })
    .max(maximo, { error: `Máximo ${maximo} caracteres.` });

/** Validación del formulario de servicio de la administración (HU-04, CA3). */
export const esquemaServicio = z.object({
  nombre: texto('el nombre del servicio', 80),
  categoria: z.custom<CategoriaServicio>(
    (valor) => typeof valor === 'string' && valor in CATEGORIAS_SERVICIO,
    { error: 'Elige una categoría.' },
  ),
  descripcion: texto('la descripción', 500),
  publico: texto('el público objetivo', 150),
  formaSolicitud: texto('la forma de solicitud', 200),
  horario: texto('el horario', 150),
  requiereCuenta: z.boolean(),
  activo: z.boolean(),
});

export type DatosFormularioServicio = z.infer<typeof esquemaServicio>;
