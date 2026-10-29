/**
 * Fotos del carrusel de Inicio (comunidad). Para poner una foto real, copia el archivo en
 * assets/images/ y cambia su `fuente` por el require, por ejemplo:
 *
 *   { fuente: require('@/assets/images/inicio-sala.jpg'), descripcion: 'Sala de lectura' },
 *
 * Mientras la fuente sea null, el carrusel muestra un recuadro provisional en su lugar.
 * Conviene que las fotos sean horizontales (16:9) y pesen menos de 300 KB.
 */
import type { ImageProps } from 'expo-image';

export type ImagenInicio = {
  /** require('@/assets/images/…') o null mientras no haya foto. */
  fuente: ImageProps['source'] | null;
  /** Qué muestra la foto: la lee el lector de pantalla. */
  descripcion: string;
};

export const IMAGENES_INICIO: ImagenInicio[] = [
  { fuente: null, descripcion: 'Foto de la biblioteca 1' },
  { fuente: null, descripcion: 'Foto de la biblioteca 2' },
  { fuente: null, descripcion: 'Foto de la biblioteca 3' },
];
