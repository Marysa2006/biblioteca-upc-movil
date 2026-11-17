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
