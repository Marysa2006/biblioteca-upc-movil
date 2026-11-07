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

/** Fotos de la biblioteca y del campus (#164), recortadas a 16:9 y de menos de 300 KB. */
export const IMAGENES_INICIO: ImagenInicio[] = [
  {
    fuente: require('@/assets/images/inicio-coleccion.jpg'),
    descripcion: 'Estanterías de la colección y mesas de estudio de la biblioteca',
  },
  {
    fuente: require('@/assets/images/inicio-sala-lectura.jpg'),
    descripcion: 'Sala de lectura de la biblioteca con estudiantes en las mesas',
  },
  {
    fuente: require('@/assets/images/inicio-campus.jpg'),
    descripcion: 'Campus de la Universidad Popular del Cesar con el letrero Yo amo UPC',
  },
];
