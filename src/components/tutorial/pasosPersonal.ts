/**
 * Los pasos del tutorial del personal (#267), con los textos aprobados por María.
 * Cada persona ve solo los pasos de lo que puede usar, con los mismos permisos que la app:
 * - Gestión muestra solo las secciones que la persona tiene (seccionesGestionVisibles);
 * - Personal, con `roles`; Inventario, con `tablets`; Estadísticas, con `estadisticas`.
 * Así, la administración ve 7 pasos, y el facilitador y la gestora de espacios, 4.
 * El Dashboard no tiene paso mientras esté en construcción.
 * Función pura: recibe el usuario y no consulta nada.
 */
import type { Usuario } from '@/types';
import { seccionesGestionVisibles } from '@/utils/gestion';
import { describirRoles, tienePermiso } from '@/utils/roles';

import type { PasoTutorial } from './pasos';

/** "A", "A y B", "A, B y C". */
function enumerar(partes: string[]): string {
  if (partes.length <= 1) return partes.join('');
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
}

export function pasosPersonal(usuario: Usuario): PasoTutorial[] {
  const puede = (permiso: Parameters<typeof tienePermiso>[1]) => tienePermiso(usuario, permiso);
  const primerNombre = usuario.nombre.split(' ')[0];
  const secciones = seccionesGestionVisibles(puede);
  const nombresSecciones = enumerar(secciones.map((seccion) => seccion.etiqueta));

  const pasos: (PasoTutorial | null)[] = [
    {
      pose: 'saludando',
      ilustracion: 'portadaPersonal',
      titulo: `¡Hola, ${primerNombre}!`,
      texto: `Esta es la vista del personal de la biblioteca. Te muestro dónde está lo que puedes hacer con tu rol: ${describirRoles(usuario)}.`,
    },
    secciones.length > 0
      ? {
          pose: 'senalando',
          ilustracion: 'gestion',
          ubicacion: { tipo: 'pestana', vista: 'personal', pestana: 'gestion' },
          secciones,
          titulo: 'Gestión',
          texto:
            secciones.length === 1
              ? `Aquí atiendes el trabajo del día, en la sección ${nombresSecciones}.`
              : `Aquí atiendes el trabajo del día. Arriba eliges la sección: ${nombresSecciones}.`,
        }
      : null,
    puede('roles')
      ? {
          pose: 'senalando',
          ilustracion: 'equipo',
          ubicacion: { tipo: 'pestana', vista: 'personal', pestana: 'equipo' },
          titulo: 'Personal',
          texto: 'Aquí asignas o retiras los roles del personal de la biblioteca.',
        }
      : null,
    puede('tablets')
      ? {
          pose: 'leyendo',
          ilustracion: 'inventario',
          ubicacion: { tipo: 'pestana', vista: 'personal', pestana: 'inventario' },
          titulo: 'Inventario',
          texto:
            'Aquí ves cuántas tablets hay disponibles, en préstamo y en mantenimiento, y envías una a mantenimiento cuando lo necesita.',
        }
      : null,
    puede('estadisticas')
      ? {
          pose: 'senalando',
          ilustracion: 'estadisticas',
          ubicacion: { tipo: 'pestana', vista: 'personal', pestana: 'estadisticas' },
          titulo: 'Estadísticas',
          texto:
            'Aquí ves los indicadores de uso con sus filtros, los exportas para abrirlos en Excel y revisas cada registro.',
        }
      : null,
    {
      pose: 'senalando',
      ilustracion: 'menuPersonal',
      ubicacion: { tipo: 'menu' },
      titulo: 'Tu menú',
      texto:
        'Aquí cambias a la vista de la comunidad para ver la app como la ven los usuarios, y encuentras tu perfil, tus notificaciones y este tutorial.',
    },
    {
      pose: 'listo',
      ilustracion: 'portadaPersonal',
      titulo: '¡Listo!',
      texto: 'Ya conoces tu vista. Puedes repetir el tutorial desde el menú, arriba a la derecha.',
    },
  ];

  return pasos.filter((paso): paso is PasoTutorial => paso !== null);
}
