import type { Contenido, FotoInicio, Recurso } from '@/types';

/** `GET /portal/home-photos/` (arreglo, sin paginar, ya en su orden). */
export type FotoInicioBackend = {
  id: number;
  image: string;
  description: string;
  order: number;
  is_published: boolean;
};

export function fotoInicioDesdeBackend(foto: FotoInicioBackend): FotoInicio {
  return {
    id: String(foto.id),
    imagen: foto.image,
    descripcion: foto.description,
    orden: foto.order,
    publicada: foto.is_published,
  };
}

export async function cuerpoFotoInicio(
  datos: Pick<FotoInicio, 'imagen' | 'descripcion' | 'publicada'>,
  anterior?: string,
) {
  const campos = { description: datos.descripcion.trim(), is_published: datos.publicada };
  if (datos.imagen === anterior) return JSON.stringify(campos);
  const cuerpo = new FormData();
  cuerpo.append('description', campos.description);
  cuerpo.append('is_published', String(campos.is_published));
  if (/^(https?|blob|data):/.test(datos.imagen)) {
    const respuesta = await fetch(datos.imagen);
    if (!respuesta.ok) throw new Error('No se pudo leer la imagen.');
    const archivo = await respuesta.blob();
    const extension = archivo.type.split('/')[1] || 'jpg';
    cuerpo.append('image', archivo, `inicio.${extension}`);
  } else {
    const extension = /\.(png|webp)(?:$|\?)/i.exec(datos.imagen)?.[1].toLowerCase() ?? 'jpeg';
    cuerpo.append('image', {
      uri: datos.imagen, name: `inicio.${extension}`, type: `image/${extension}`,
    } as unknown as Blob);
  }
  return cuerpo;
}

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

export type ContenidoGestionBackend = ContenidoPortal & {
  id: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  order?: number;
};

export function contenidoGestionDesdeBackend(contenido: ContenidoGestionBackend): Contenido {
  const base = contenidoDesdePortal(contenido);
  return {
    ...base,
    tipo: contenido.content_type === 'PAGE' ? 'servicio' : base.tipo,
    publicado: contenido.status === 'PUBLISHED',
    orden: contenido.order ?? 0,
  };
}

export function contenidoHaciaBackend(
  datos: Omit<Contenido, 'id' | 'orden'> & { orden?: number },
  anterior?: ContenidoGestionBackend,
) {
  const tipos = { aviso: 'NOTICE', informativo: 'NEWS', servicio: 'PAGE' };
  return {
    content_type: tipos[datos.tipo],
    title: datos.titulo.trim(),
    body: datos.descripcion.trim(),
    status: datos.publicado ? 'PUBLISHED' : anterior?.status === 'PUBLISHED' ? 'HIDDEN' : anterior?.status ?? 'DRAFT',
    order: datos.orden,
  };
}
