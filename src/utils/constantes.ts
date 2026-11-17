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
  'Bellas Artes',
  'Ciencias Agrarias y del Ambiente',
  'Ciencias Básicas y Aplicadas',
  'Ciencias de la Salud',
  'Ciencias Económicas y Administrativas',
  'Ciencias Jurídicas y Políticas',
  'Educación',
  'Ingenierías',
];

/** Sedes de la Universidad (provisional). */
export const SEDES: readonly string[] = ['Valledupar', 'Aguachica'];

/** Niveles de formación (provisional). */
export const NIVELES_FORMACION: readonly string[] = ['pregrado', 'posgrado'];

/** Semestres del I al X, como los escribe la biblioteca (provisional). */
export const SEMESTRES: readonly string[] = Array.from({ length: 10 }, (_, i) =>
  String(i + 1),
);

/** Duración de una asesoría, en minutos, igual para todas (#248). */
export const DURACION_ASESORIA_MINUTOS = 60;
