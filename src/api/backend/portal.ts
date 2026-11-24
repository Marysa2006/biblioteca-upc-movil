import type { Contenido, Recurso } from '@/types';

export type RecursosPortal = {
  categories: {
    resources: {
      id: number;
      name: string;
      description?: string;
      url: string | null;
      requires_authentication?: boolean;
    }[];
  }[];
};

export function recursosDesdePortal(respuesta: RecursosPortal): Recurso[] {
  return respuesta.categories.flatMap(({ resources }) =>
    resources.map((recurso) => ({
      id: String(recurso.id),
      nombre: recurso.name,
      descripcion: recurso.description ?? '',
      url: recurso.url,
      requiereCuenta: recurso.requires_authentication ?? recurso.url === null,
    })),
  );
}

export type ContenidoPortal = {
  slug: string;
  content_type: 'NOTICE' | 'NEWS' | 'PAGE';
  title: string;
  body: string;
};

/** ¿Es un aviso (`NOTICE`) o una noticia (`NEWS`)? Las páginas (`PAGE`) no van en Inicio. */
export function esNovedad(contenido: ContenidoPortal): boolean {
  return contenido.content_type !== 'PAGE';
}

export function contenidoDesdePortal(contenido: ContenidoPortal): Contenido {
  return {
    id: contenido.slug,
    tipo: contenido.content_type === 'NOTICE' ? 'aviso' : 'informativo',
    titulo: contenido.title,
    descripcion: contenido.body,
    publicado: true,
    // El listado público ya viene ordenado y no expone el campo order.
    orden: 0,
  };
}
