/**
 * Los pasos del tutorial, con los textos aprobados por María: los de la comunidad (#261) están
 * aquí; los del personal (#267) se arman según los permisos en pasosPersonal.ts.
 * - ilustracion: lo que se dibuja en la banda oscura, con piezas de la app (IlustracionTutorial).
 * - ubicacion: dónde está en la app lo que explica el paso (una pestaña o el menú), si aplica.
 * - pose: la de Upecito, asomado en la banda. El texto dice todo: Upecito es decorativo.
 */
import type { PoseUpecito } from '@/components/ui';
import type { InfoSeccionGestion } from '@/utils/gestion';

export type IlustracionPaso =
  // Comunidad (#261)
  | 'portada'
  | 'servicios'
  | 'catalogo'
  | 'solicitudes'
  | 'menu'
  // Personal (#267)
  | 'portadaPersonal'
  | 'gestion'
  | 'equipo'
  | 'inventario'
  | 'estadisticas'
  | 'menuPersonal';

/** Las pestañas de la comunidad, en el orden de (comunidad)/_layout.tsx. */
export type PestanaComunidad = 'inicio' | 'servicios' | 'catalogo' | 'solicitudes';

/** Las pestañas del personal, en el orden de (personal)/_layout.tsx. */
export type PestanaPersonal = 'panel' | 'gestion' | 'equipo' | 'inventario' | 'estadisticas';

export type UbicacionPaso =
  | { tipo: 'pestana'; vista: 'comunidad'; pestana: PestanaComunidad }
  | { tipo: 'pestana'; vista: 'personal'; pestana: PestanaPersonal }
  | { tipo: 'menu' };

export type PasoTutorial = {
  pose: PoseUpecito;
  ilustracion: IlustracionPaso;
  ubicacion?: UbicacionPaso;
  /** Solo en el paso de Gestión: las secciones que la persona tiene. */
  secciones?: readonly InfoSeccionGestion[];
  titulo: string;
  texto: string;
};

/** El tutorial de la comunidad (#261). */
export const PASOS_COMUNIDAD: readonly PasoTutorial[] = [
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
    ubicacion: { tipo: 'pestana', vista: 'comunidad', pestana: 'servicios' },
    titulo: 'Servicios',
    texto:
      'Aquí están todos los servicios de la biblioteca y cómo pedirlos. Puedes verlos sin cuenta.',
  },
  {
    pose: 'senalando',
    ilustracion: 'catalogo',
    ubicacion: { tipo: 'pestana', vista: 'comunidad', pestana: 'catalogo' },
    titulo: 'Catálogo',
    texto:
      'Busca libros en el catálogo, trabajos de grado en el repositorio y bibliotecas en línea, sin cuenta. Las guías de la biblioteca se guardan para leerlas sin conexión.',
  },
  {
    pose: 'leyendo',
    ilustracion: 'solicitudes',
    ubicacion: { tipo: 'pestana', vista: 'comunidad', pestana: 'solicitudes' },
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
