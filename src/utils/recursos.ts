/**
 * Búsqueda entre los recursos en línea (HU-03, mejora): filtra la lista por nombre, descripción
 * y área, sin tildes ni mayúsculas. Busca en la lista, no dentro de cada base.
 *
 * PROVISIONAL: `Recurso` no trae el área, así que se deduce de palabras de la descripción. Si
 * la biblioteca la confirma, conviene agregar `areas` al tipo y quitar PALABRAS_AREA.
 */
import type { Recurso } from '@/types';
import { normalizarTexto } from '@/utils/texto';

export type AreaRecurso = 'salud' | 'derecho' | 'ciencias' | 'educacion' | 'negocios';

/** Las áreas en el orden de los chips. */
export const AREAS_RECURSO: AreaRecurso[] = ['salud', 'derecho', 'ciencias', 'educacion', 'negocios'];

export const NOMBRE_AREA: Record<AreaRecurso, string> = {
  salud: 'Salud',
  derecho: 'Derecho',
  ciencias: 'Ciencias y tecnología',
  educacion: 'Educación',
  negocios: 'Negocios',
};

/** Raíces (sin tildes) que ubican un recurso en un área; un recurso puede tener varias. */
const PALABRAS_AREA: Record<AreaRecurso, string[]> = {
  salud: ['enfermeria', 'salud', 'clinic', 'medic'],
  derecho: ['jurisprudencia', 'legislacion', 'juridic', 'normativa', 'doctrina'],
  ciencias: ['cientific', 'ciencias', 'tecnic', 'ingenieria'],
  educacion: ['educacion', 'pedagogia'],
  negocios: ['comercio', 'aduana', 'talento humano', 'gestion'],
};

const textoDe = (recurso: Recurso) => normalizarTexto(`${recurso.nombre} ${recurso.descripcion}`);

/** Las áreas de un recurso, según las palabras de su nombre y descripción. */
export function areasDeRecurso(recurso: Recurso): AreaRecurso[] {
  const texto = textoDe(recurso);
  return AREAS_RECURSO.filter((area) => PALABRAS_AREA[area].some((palabra) => texto.includes(palabra)));
}

/**
 * Los recursos que coinciden con lo buscado: el texto aparece en el nombre o la descripción,
 * o es el nombre de un área ("derecho" trae las bases jurídicas aunque no digan "derecho").
 * Con `area`, solo los de esa área. Sin texto ni área, todos, en el mismo orden.
 */
export function buscarRecursos(recursos: Recurso[], busqueda: string, area: AreaRecurso | 'todas' = 'todas'): Recurso[] {
  const texto = normalizarTexto(busqueda.trim());
  // Desde 3 letras, "dere" ya cuenta como el área Derecho.
  const areasBuscadas =
    texto.length >= 3
      ? AREAS_RECURSO.filter((a) => normalizarTexto(NOMBRE_AREA[a]).startsWith(texto) || a.startsWith(texto))
      : [];

  return recursos.filter((recurso) => {
    const areas = areasDeRecurso(recurso);
    if (area !== 'todas' && !areas.includes(area)) return false;
    if (!texto) return true;
    return textoDe(recurso).includes(texto) || areas.some((a) => areasBuscadas.includes(a));
  });
}

/** "1 recurso" o "12 recursos". */
export function textoRecursos(cantidad: number): string {
  return cantidad === 1 ? '1 recurso' : `${cantidad} recursos`;
}
