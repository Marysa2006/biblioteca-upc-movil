import type { NivelFormacion } from '@/types';

/** Nombre visible de la app. Cuando se elija el nombre definitivo, se cambia solo aquí y en app.json. */
export const NOMBRE_APP = 'BiblioUPC';

/** Dominio del correo institucional (HU-05). Confirmar con el ingeniero cuando se defina el login real. */
export const DOMINIO_CORREO = 'unicesar.edu.co';

/** Catálogo público (OPAC) de Koha. Confirmar la URL con el ingeniero de la biblioteca (HU-02). */
export const URL_CATALOGO_KOHA: string = 'https://koha.unicesar.edu.co';

/**
 * Repositorio Institucional (DSpace 7.5, HU-11). Va con http porque el servidor todavía no
 * responde por https: el APK lo permite con usesCleartextTraffic en app.json. Cuando la
 * Universidad active https, se cambia aquí y se quita esa opción.
 */
export const URL_REPOSITORIO: string = 'http://repositorio.unicesar.edu.co';


/**
 * Listas provisionales de los formularios de la versión 1.1 (#247): facultades, sedes y niveles
 * de formación. Las confirmará la biblioteca; mientras tanto, son las que pidió en su documento.
 */
export const FACULTADES: readonly string[] = [
  'Ciencias Administrativas, Contables y Económicas',
  'Bellas Artes',
  'Derecho, Ciencias Políticas y Sociales',
  'Ciencias Básicas',
  'Ingenierías y Tecnologías',
  'Ciencias de la Salud',
  'Educación',
];

/** Sedes de la Universidad (provisional). */
export const SEDES: readonly string[] = ['Valledupar', 'Aguachica'];

/** Niveles de formación (provisional), con el tipo que usa `Usuario.nivel`. */
export const NIVELES_FORMACION: readonly NivelFormacion[] = ['pregrado', 'posgrado'];

/**
 * Semestres del I al X, como los escribe la biblioteca (provisional). Es la lista para mostrar;
 * lo que se guarda en `semestre` es el número, así que el formulario usa la posición + 1.
 */
export const SEMESTRES: readonly string[] = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
];

/** Duración de una asesoría, en minutos, igual para todas (#248). */
export const DURACION_ASESORIA_MINUTOS = 60;
