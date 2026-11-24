import type { CategoriaServicio, Servicio } from '@/types';
import { URL_REPOSITORIO } from '@/utils/constantes';

type ResumenPortal = {
  slug: string;
  name: string;
  summary: string;
  is_available: boolean;
  requires_authentication?: boolean;
  access_url?: string;
};

export type ServiciosPortal = {
  categories: { slug: string; services: ResumenPortal[] }[];
};

export type FichaPortal = ResumenPortal & {
  category: { slug: string };
  description: string;
  target_audience: string;
  request_method: string;
  schedule: string;
};

export type FichaServicio = Servicio & { soloInformativo?: boolean };

const categoriasPorAcceso = new Map<string, CategoriaServicio>([
  ['/tablets', 'tablets'],
  ['/espacios', 'espacios'],
  ['/asesorias', 'asesorias'],
  ['/capacitaciones', 'capacitaciones'],
  [URL_REPOSITORIO, 'repositorio'],
]);

const categoriasPorSlug = new Map<string, CategoriaServicio>([
  ['asesorias', 'asesorias'],
  ['capacitaciones', 'capacitaciones'],
  ['espacios', 'espacios'],
  ['repositorio', 'repositorio'],
  ['prestamos', 'prestamo'],
]);

function categoriaDelAcceso(url = '') {
  return categoriasPorAcceso.get(url.replace(/\/$/, ''));
}

function resumenDesdePortal(servicio: ResumenPortal, categoria: CategoriaServicio): Servicio {
  return {
    id: servicio.slug,
    nombre: servicio.name,
    descripcion: servicio.summary,
    categoria,
    publico: '',
    formaSolicitud: '',
    horario: '',
    requiereCuenta: servicio.requires_authentication ?? false,
    activo: servicio.is_available,
  };
}

export function serviciosDesdePortal(respuesta: ServiciosPortal): Servicio[] {
  return respuesta.categories.flatMap(({ slug, services }) =>
    services.flatMap((servicio) => {
      const categoria = categoriaDelAcceso(servicio.access_url) ?? categoriasPorSlug.get(slug);
      return categoria && servicio.is_available ? [resumenDesdePortal(servicio, categoria)] : [];
    }),
  );
}

export function fichaDesdePortal(servicio: FichaPortal): FichaServicio | undefined {
  const acceso = categoriaDelAcceso(servicio.access_url);
  const categoria = acceso ?? categoriasPorSlug.get(servicio.category.slug);
  if (!categoria || !servicio.is_available) return undefined;

  return {
    ...resumenDesdePortal(servicio, categoria),
    descripcion: servicio.description,
    publico: servicio.target_audience,
    formaSolicitud: servicio.request_method,
    horario: servicio.schedule,
    soloInformativo: !acceso,
  };
}
