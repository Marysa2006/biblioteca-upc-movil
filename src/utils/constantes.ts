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
 * Es la copia que publica la Universidad en ORFEO (verificada el 16 de noviembre de 2026:
 * es el mismo documento que está en la carpeta del proyecto). El enlace «Política de
 * Tratamiento de Datos Personales» del portal apunta a un SharePoint que exige cuenta
 * institucional, así que desde la app no se puede abrir.
 */
export const URL_POLITICA_DATOS: string =
  'https://orfeo2022.unicesar.edu.co/pqrs/frontend/web/manuales/acuerdo_No-019_del_5_de_octubre_de_2020_Pol%C3%ADtica_tratamiento_de_datos_personales.pdf';

/** Fecha del Acuerdo 019. Si la Universidad publica otra política, se cambia y se vuelve a pedir la aceptación. */
export const VERSION_POLITICA_DATOS = '2020-10-05';

/** Correo de la UPC para ejercer los derechos sobre los datos personales (numeral IV de la autorización). */
export const CORREO_DATOS_PERSONALES = 'tratamientodedatos@unicesar.edu.co';
