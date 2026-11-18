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
 * Facultades de la UPC (provisional, por confirmar con la biblioteca).
 * Son las que publica la Universidad en su Estructura Organizacional: los decanos son seis.
 * El portal de Pregrado lista «Ciencias Básicas» y «Educación» por separado, pero la
 * Universidad las nombra juntas como «Ciencias Básicas y de la Educación».
 */
export const FACULTADES: readonly string[] = [
  'Ciencias Administrativas, Contables y Económicas',
  'Bellas Artes',
  'Derecho, Ciencias Políticas y Sociales',
  'Ciencias Básicas y de la Educación',
  'Ingenierías y Tecnologías',
  'Ciencias de la Salud',
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

/**
 * Política de Tratamiento y Protección de Datos Personales de la UPC: el Acuerdo 019 del
 * 5 de octubre de 2020 (#225). Es el texto legal de la Universidad, no uno redactado por
 * el equipo.
 *
 * Es el PDF del portal institucional de normatividad (verificado el 17 de noviembre de 2026):
 * abre sin cuenta y es el mismo documento byte a byte que el Acuerdo archivado en el proyecto
 * (591 KB, 19 páginas, md5 af6029a2…ef1). La misma copia está en ORFEO:
 * https://orfeo2022.unicesar.edu.co/pqrs/frontend/web/manuales/acuerdo_No-019_del_5_de_octubre_de_2020_Pol%C3%ADtica_tratamiento_de_datos_personales.pdf
 */
export const URL_POLITICA_DATOS: string =
  'https://ant.unicesar.edu.co/index.php/en/normatividad/doc_download/6061-acuerdo-no-019-del-5-de-octubre-de-2020-politica-tratamiento-de-datos-personales';

/** Fecha del Acuerdo 019. Si la Universidad publica otra política, se cambia y se vuelve a pedir la aceptación. */
export const VERSION_POLITICA_DATOS = '2020-10-05';

/** Correo de la UPC para ejercer los derechos sobre los datos personales (numeral IV de la autorización). */
export const CORREO_DATOS_PERSONALES = 'tratamientodedatos@unicesar.edu.co';

/**
 * Módulo PQRS de la Universidad, la otra vía que da el Acuerdo para ejercer los derechos
 * (numerales 9.3 y 9.4: «o ingresando al enlace ubicado en el módulo PQRS de la página web»).
 * Es el enlace que publica la Universidad en «Atención al ciudadano».
 */
export const URL_PQRS: string =
  'https://orfeo2022.unicesar.edu.co/pqrs/frontend/web/index.php';

/** NIT de la Universidad como responsable del tratamiento (Acuerdo 019, numeral 2, literal b). */
export const NIT_UNIVERSIDAD = '892.300.285-6';

/**
 * Plazos con que la Universidad responde (Acuerdo 019, numerales 9.3 y 9.4): días hábiles.
 * Se muestran en la autorización porque son lo que la persona necesita saber al ejercer un derecho.
 */
export const DIAS_HABILES_CONSULTA = 10;
export const DIAS_HABILES_RECLAMO = 15;

/**
 * Las tres notas del formato de responsabilidad sobre el préstamo (versión 1.1, #252).
 * La tercera lleva el valor del bien; se arma con `notasDelPrestamo()` de `utils/prestamos`,
 * que lo toma de la tablet del préstamo.
 */
export const NOTAS_PRESTAMO: readonly string[] = [
  'Préstamo a la comunidad universitaria activa: estudiantes, docentes y administrativos.',
  'Los bienes objeto de préstamo deben ser entregados en las condiciones iniciales al préstamo.',
  'Los bienes son de propiedad de la Universidad Popular del Cesar. En caso de pérdida (robo, etcétera) o cualquier tipo de daño, la UPC deberá hacer efectiva la garantía y exigir al responsable del bien el valor de este.',
];
