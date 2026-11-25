/**
 * Pantallas de guías sin conexión (HU-29): estado de cada guía frente a su copia guardada y
 * el texto en bloques para leerlo. Funciones puras, sin hooks.
 *
 * Versión 1.1 (#258): el formulario con que la biblioteca publica sus guías, con enlace (Drive o
 * una página) o escritas en la app; desde el #303, también su PDF.
 */
import { z } from 'zod';

import type { ArchivoGuia, Guia, GuiaGuardada } from '@/types';
import { enlaceValido } from '@/utils/agenda';

/**
 * Cómo está una guía en el celular: guardada y al día, guardada pero con versión nueva
 * publicada (CA3), o sin guardar (CA4).
 */
export type EstadoGuia = 'guardada' | 'desactualizada' | 'sin_guardar';

export function estadoGuia(guia: Guia, guardadas: GuiaGuardada[]): EstadoGuia {
  const guardada = guardadas.find((g) => g.guia.id === guia.id);
  if (!guardada) return 'sin_guardar';
  return Date.parse(guardada.guia.actualizada) < Date.parse(guia.actualizada)
    ? 'desactualizada'
    : 'guardada';
}

/** Guías publicadas con una versión más nueva que la guardada en el celular (CA3). */
export function guiasDesactualizadas(publicadas: Guia[], guardadas: GuiaGuardada[]): Guia[] {
  return publicadas.filter((guia) => estadoGuia(guia, guardadas) === 'desactualizada');
}

/** Un bloque del texto de una guía: título, párrafo o paso numerado. */
export type BloqueGuia = { tipo: 'titulo' | 'parrafo' | 'paso'; texto: string };

/**
 * Divide el texto plano de una guía en bloques: la primera línea es el título, las que
 * empiezan con "1." son pasos y las demás, párrafos. Las líneas vacías separan.
 */
export function bloquesDeGuia(contenido: string): BloqueGuia[] {
  const lineas = contenido.split('\n').map((linea) => linea.trim()).filter((linea) => linea !== '');
  return lineas.map((texto, indice) => {
    if (indice === 0) return { tipo: 'titulo', texto };
    if (/^\d+[.)]\s/.test(texto)) return { tipo: 'paso', texto };
    return { tipo: 'parrafo', texto };
  });
}

/**
 * Cómo se lee una guía: en el navegador, con su enlace; escrita en la app (#258); o su PDF,
 * guardado en el celular y abierto con el visor del sistema (#303).
 */
export type FormatoGuia = 'pdf' | 'enlace' | 'escrita';

/**
 * Nombre de cada formato (tarjeta y lector de pantalla), su nombre corto (el botón segmentado del
 * formulario, donde tres nombres largos no caben) y su ícono.
 */
export const FORMATOS_GUIA: Record<FormatoGuia, { nombre: string; corto: string; icono: string }> = {
  pdf: { nombre: 'Archivo PDF', corto: 'PDF', icono: 'file-pdf-box' },
  // Con el PDF como formato propio (#303), el enlace queda para Drive o una página web.
  enlace: { nombre: 'Enlace (Drive o web)', corto: 'Enlace', icono: 'link-variant' },
  escrita: { nombre: 'Escrita aquí', corto: 'Escrita', icono: 'text-box-outline' },
};

export function formatoDe(guia: Pick<Guia, 'enlace' | 'archivo'>): FormatoGuia {
  if (guia.archivo) return 'pdf';
  return guia.enlace ? 'enlace' : 'escrita';
}

/** El PDF de una guía pesa como máximo 10 MB (#303): se descarga entero al celular. */
export const BYTES_MAXIMOS_PDF = 10 * 1024 * 1024;

/** «2,4 MB» o «850 KB», para mostrar el tamaño del PDF. */
export function textoTamano(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Por qué el PDF elegido no sirve, o null (#303, CA4). Lo usan el formulario y la API simulada. */
export function problemaArchivoGuia(archivo: Pick<ArchivoGuia, 'nombre' | 'bytes'>): string | null {
  if (!/\.pdf$/i.test(archivo.nombre.trim())) return 'Elige un archivo PDF.';
  if (archivo.bytes <= 0) return 'El archivo está vacío. Elige otro PDF.';
  if (archivo.bytes > BYTES_MAXIMOS_PDF) {
    return `El PDF pesa ${textoTamano(archivo.bytes)}; el máximo es ${textoTamano(BYTES_MAXIMOS_PDF)}.`;
  }
  return null;
}

/**
 * Formulario de una guía (#258): título y descripción, y según el formato el PDF (#303), un enlace
 * `https` (CA3) o el contenido escrito.
 */
export const esquemaGuia = z
  .object({
    formato: z.enum(['pdf', 'enlace', 'escrita']),
    titulo: z
      .string()
      .trim()
      .min(1, { error: 'Escribe el título.' })
      .max(80, { error: 'Máximo 80 caracteres.' }),
    descripcion: z
      .string()
      .trim()
      .min(1, { error: 'Escribe la descripción.' })
      .max(200, { error: 'Máximo 200 caracteres.' }),
    archivo: z.object({ url: z.string(), nombre: z.string(), bytes: z.number() }).nullable(),
    enlace: z.string().trim(),
    contenido: z.string().trim().max(5000, { error: 'Máximo 5000 caracteres.' }),
    publicado: z.boolean(),
  })
  .superRefine((datos, ctx) => {
    if (datos.formato === 'pdf') {
      const problema = datos.archivo
        ? problemaArchivoGuia(datos.archivo)
        : 'Elige el PDF de la guía.';
      if (problema) ctx.addIssue({ code: 'custom', path: ['archivo'], message: problema });
    } else if (datos.formato === 'enlace') {
      if (datos.enlace === '') {
        ctx.addIssue({
          code: 'custom',
          path: ['enlace'],
          message: 'Pega el enlace del Drive o de la página de la guía.',
        });
      } else if (!enlaceValido(datos.enlace)) {
        ctx.addIssue({
          code: 'custom',
          path: ['enlace'],
          message: 'El enlace tiene que empezar por https://, por ejemplo https://drive.google.com/…',
        });
      }
    } else if (datos.contenido === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['contenido'],
        message: 'Escribe el contenido de la guía.',
      });
    }
  });

export type FormularioGuia = z.input<typeof esquemaGuia>;

/**
 * Lo que se envía a la API al crear o editar una guía; el id y la fecha de actualización los
 * asigna el sistema. `enlace: null` = la guía no tiene enlace: al editar, el Backend lo borra
 * (#297). Con `undefined`, `JSON.stringify` quitaría el campo y el enlace se quedaría. Lo mismo
 * con `archivo: null`: la guía ya no es un PDF (#303).
 */
export type DatosGuia = Omit<Guia, 'id' | 'actualizada' | 'enlace' | 'archivo'> & {
  enlace: string | null;
  archivo: ArchivoGuia | null;
};

/** Lo que se envía a la API: solo el PDF, solo el enlace o solo el contenido, según el formato. */
export function datosDeGuia(valores: z.output<typeof esquemaGuia>): DatosGuia {
  const { formato, archivo } = valores;
  // Sin el nombre real del PDF (el selector de Android no lo da), el archivo toma el del título.
  const conNombre =
    archivo && archivo.nombre === NOMBRE_PDF_ELEGIDO
      ? { ...archivo, nombre: nombreArchivoDe(valores.titulo) }
      : archivo;
  return {
    titulo: valores.titulo,
    descripcion: valores.descripcion,
    contenido: formato === 'escrita' ? valores.contenido : '',
    enlace: formato === 'enlace' ? valores.enlace : null,
    archivo: formato === 'pdf' ? conNombre : null,
    publicado: valores.publicado,
  };
}

/**
 * El nombre de un PDF elegido cuando el sistema no da el suyo (#303): en Android, el selector
 * entrega una referencia `content://…/msf:2342` sin el nombre real.
 */
export const NOMBRE_PDF_ELEGIDO = 'documento.pdf';

/** «Normas APA 7» → «normas-apa-7.pdf»: el nombre del PDF a partir del título de la guía. */
export function nombreArchivoDe(titulo: string): string {
  const base = titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'guia'}.pdf`;
}

/** ¿El PDF es uno recién elegido en el celular, que todavía hay que subir? (#303). */
export function esArchivoLocal(archivo: Pick<ArchivoGuia, 'url'>): boolean {
  return !/^https?:\/\//i.test(archivo.url);
}
