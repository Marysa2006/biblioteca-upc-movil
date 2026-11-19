/**
 * Los pasos del tutorial del primer ingreso (#261), con los textos aprobados por María.
 * - ilustracion: lo que se dibuja en la banda oscura, con piezas de la app (IlustracionTutorial).
 * - ubicacion: dónde está en la app lo que explica el paso (una pestaña o el menú), si aplica.
 * - pose: la de Upecito, asomado en la banda. El texto dice todo: Upecito es decorativo.
 */
import type { PoseUpecito } from '@/components/ui';

export type IlustracionPaso = 'portada' | 'servicios' | 'catalogo' | 'solicitudes' | 'menu';

/** Las pestañas de la comunidad, en el orden de (comunidad)/_layout.tsx. */
export type PestanaComunidad = 'inicio' | 'servicios' | 'catalogo' | 'solicitudes';

export type UbicacionPaso = { tipo: 'pestana'; pestana: PestanaComunidad } | { tipo: 'menu' };

export type PasoTutorial = {
  pose: PoseUpecito;
  ilustracion: IlustracionPaso;
  ubicacion?: UbicacionPaso;
  titulo: string;
  texto: string;
};

export const PASOS_TUTORIAL: readonly PasoTutorial[] = [
  {
    pose: 'saludando',
    ilustracion: 'portada',
    titulo: '¡Hola! Soy Upecito',
    texto:
      'Te acompaño en BiblioUPC, la app de la Biblioteca de la Universidad Popular del Cesar. Te muestro lo principal.',
  },
  {
    pose: 'senalando',
    ilustracion: 'servicios',
    ubicacion: { tipo: 'pestana', pestana: 'servicios' },
    titulo: 'Servicios',
    texto:
      'Aquí están todos los servicios de la biblioteca y cómo pedirlos. Puedes verlos sin cuenta.',
  },
  {
    pose: 'senalando',
    ilustracion: 'catalogo',
    ubicacion: { tipo: 'pestana', pestana: 'catalogo' },
    titulo: 'Catálogo',
    texto:
      'Busca libros en el catálogo, trabajos de grado en el repositorio y bibliotecas en línea, sin cuenta. Las guías de la biblioteca se guardan para leerlas sin conexión.',
  },
  {
    pose: 'leyendo',
    ilustracion: 'solicitudes',
    ubicacion: { tipo: 'pestana', pestana: 'solicitudes' },
    titulo: 'Mis solicitudes',
    texto:
      'Con tu cuenta institucional pides asesorías, capacitaciones, tablets y espacios, y aquí sigues el estado de cada una.',
  },
  {
    pose: 'senalando',
    ilustracion: 'menu',
    ubicacion: { tipo: 'menu' },
    titulo: 'Tu menú',
    texto:
      'Aquí inicias sesión y encuentras tus notificaciones, Mi calendario con recordatorios y este tutorial.',
  },
  {
    pose: 'listo',
    ilustracion: 'portada',
    titulo: '¡Listo!',
    texto:
      'Ya conoces lo principal. Puedes repetir el tutorial desde el menú, arriba a la derecha.',
  },
];
