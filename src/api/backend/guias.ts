import type { Guia } from '@/types';
import { esArchivoLocal, type DatosGuia } from '@/utils/guias';

import { sedeDesdeBackend } from './equivalencias';

export type GuiaBackend = {
  id: number;
  title: string;
  description: string;
  body?: string;
  link?: string;
  file: { url: string; name: string; size: number } | null;
  campus?: string;
  is_published?: boolean;
  updated_at: string;
};

export function guiaDesdeBackend(guia: GuiaBackend, publicada = false): Guia {
  return {
    id: String(guia.id),
    titulo: guia.title,
    descripcion: guia.description,
    contenido: guia.body ?? '',
    publicado: guia.is_published ?? publicada,
    actualizada: guia.updated_at,
    enlace: guia.link || undefined,
    sede: sedeDesdeBackend(guia.campus),
    archivo: guia.file
      ? { url: guia.file.url, nombre: guia.file.name, bytes: guia.file.size }
      : undefined,
  };
}

export function cuerpoGuia(datos: DatosGuia): string | FormData {
  const { archivo } = datos;
  const campos = {
    title: datos.titulo,
    description: datos.descripcion,
    body: datos.contenido,
    link: datos.enlace,
    is_published: datos.publicado,
  };

  if (archivo && esArchivoLocal(archivo)) {
    const formulario = new FormData();
    for (const [campo, valor] of Object.entries(campos)) {
      formulario.append(campo, String(valor ?? ''));
    }
    formulario.append('file', {
      uri: archivo.url,
      name: archivo.nombre,
      type: 'application/pdf',
    } as unknown as Blob);
    return formulario;
  }

  return JSON.stringify(archivo === null ? { ...campos, file: null } : campos);
}
