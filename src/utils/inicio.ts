/**
 * Fotos del carrusel de Inicio (comunidad).
 *
 * Desde la versión 1.1 (#290) la biblioteca las administra desde la app (FotoInicio). Las tres
 * que trae el APK (#164) siguen aquí con dos usos: son los datos de prueba y el respaldo cuando
 * no hay conexión o no hay fotos publicadas, para que Inicio nunca quede vacío.
 * Se nombran `app://<nombre>`; fuenteFotoInicio() las convierte en su require.
 * Conviene que las fotos sean horizontales (16:9) y pesen menos de 300 KB.
 */
import type { ImageProps } from 'expo-image';
import { z } from 'zod';

import type { FotoInicio } from '@/types';

export type ImagenInicio = {
  /** require('@/assets/images/…') o null mientras no haya foto. */
  fuente: ImageProps['source'] | null;
  /** Qué muestra la foto: la lee el lector de pantalla. */
  descripcion: string;
};

/** Cuántas fotos puede haber publicadas a la vez (#290): más, y el carrusel se vuelve largo. */
export const MAXIMO_FOTOS_INICIO = 5;
export const LARGO_MAXIMO_DESCRIPCION_FOTO = 150;
export const MENSAJE_MAXIMO_FOTOS = `Ya hay ${MAXIMO_FOTOS_INICIO} fotos publicadas en Inicio. Oculta una antes de publicar otra.`;

/** Formulario de una foto de Inicio (#290, CA5): la foto y qué muestra son obligatorias. */
export const esquemaFotoInicio = z.object({
  imagen: z.string().min(1, { error: 'Elige la foto.' }),
  descripcion: z
    .string()
    .trim()
    .min(1, { error: 'Escribe qué muestra la foto: la lee el lector de pantalla.' })
    .max(LARGO_MAXIMO_DESCRIPCION_FOTO, {
      error: `Máximo ${LARGO_MAXIMO_DESCRIPCION_FOTO} caracteres.`,
    }),
  publicada: z.boolean(),
});

export type ValoresFotoInicio = z.input<typeof esquemaFotoInicio>;

/** Prefijo de las fotos que trae el APK. */
export const PREFIJO_FOTO_APP = 'app://';

/** Las fotos del APK (#164), recortadas a 16:9 y de menos de 300 KB. */
const FOTOS_APP: { nombre: string; fuente: number; descripcion: string }[] = [
  {
    nombre: 'inicio-coleccion',
    fuente: require('@/assets/images/inicio-coleccion.jpg'),
    descripcion: 'Estanterías de la colección y mesas de estudio de la biblioteca',
  },
  {
    nombre: 'inicio-sala-lectura',
    fuente: require('@/assets/images/inicio-sala-lectura.jpg'),
    descripcion: 'Sala de lectura de la biblioteca con estudiantes en las mesas',
  },
  {
    nombre: 'inicio-campus',
    fuente: require('@/assets/images/inicio-campus.jpg'),
    descripcion: 'Campus de la Universidad Popular del Cesar con el letrero Yo amo UPC',
  },
];

/** Las fotos del APK como las del carrusel de siempre. */
export const IMAGENES_INICIO: ImagenInicio[] = FOTOS_APP.map(({ fuente, descripcion }) => ({
  fuente,
  descripcion,
}));

/** Las mismas fotos como FotoInicio: los datos de prueba y el respaldo (#290, CA3). */
export const FOTOS_INICIO_APP: FotoInicio[] = FOTOS_APP.map(({ nombre, descripcion }, i) => ({
  id: `foto-app-${i + 1}`,
  imagen: `${PREFIJO_FOTO_APP}${nombre}`,
  descripcion,
  orden: i + 1,
  publicada: true,
}));

/**
 * Lo que recibe expo-image para mostrar una foto: el require de una foto del APK (`app://…`) o
 * la URL. Null si es una foto del APK que ya no existe.
 */
export function fuenteFotoInicio(imagen: string): ImageProps['source'] | null {
  if (imagen.startsWith(PREFIJO_FOTO_APP)) {
    const nombre = imagen.slice(PREFIJO_FOTO_APP.length);
    return FOTOS_APP.find((foto) => foto.nombre === nombre)?.fuente ?? null;
  }
  return { uri: imagen };
}

/** Las publicadas, en su orden: lo que ve la comunidad. */
export function fotosPublicadas(fotos: FotoInicio[]): FotoInicio[] {
  return fotos.filter((foto) => foto.publicada).sort((a, b) => a.orden - b.orden);
}

/**
 * Lo que muestra el carrusel (#290, CA3): las fotos publicadas o, si todavía no llegan, si la
 * consulta falló (sin conexión) o no hay ninguna publicada, las del APK. Inicio nunca queda vacío.
 */
export function imagenesDelCarrusel(fotos: FotoInicio[] | undefined): ImagenInicio[] {
  const publicadas = fotosPublicadas(fotos ?? []);
  if (publicadas.length === 0) return IMAGENES_INICIO;
  return publicadas.map((foto) => ({
    fuente: fuenteFotoInicio(foto.imagen),
    descripcion: foto.descripcion,
  }));
}
