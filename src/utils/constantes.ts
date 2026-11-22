import type { NivelFormacion } from '@/types';

/** Nombre visible de la app. Cuando se elija el nombre definitivo, se cambia solo aquí y en app.json. */
export const NOMBRE_APP = 'BiblioUPC';

/** Dominio del correo institucional (HU-05). Confirmar con el ingeniero cuando se defina el login real. */
export const DOMINIO_CORREO = 'unicesar.edu.co';

/** Catálogo público (OPAC) de Koha. Confirmar la URL con el ingeniero de la biblioteca (HU-02). */
export const URL_CATALOGO_KOHA: string = 'https://koha.unicesar.edu.co';

/**
 * Repositorio Institucional (DSpace 7.5, HU-11). Por https desde noviembre de 2026 (#165): la
 * Universidad lo activó con certificado de DigiCert y el http redirige aquí. Por eso el APK ya no
 * necesita usesCleartextTraffic.
 */
export const URL_REPOSITORIO: string = 'https://repositorio.unicesar.edu.co';

/**
 * Programas de pregrado de cada facultad de la UPC, con la lista que entregó María (#251).
 * «Ciencias Básicas» y «Educación» van por separado. Los que solo se ofrecen en la seccional
 * llevan «(Aguachica)» en el nombre. Quien no está en la lista (posgrado, otra dependencia) elige
 * «Otro programa» y lo escribe.
 */
export const PROGRAMAS_POR_FACULTAD: Readonly<Record<string, readonly string[]>> = {
  'Ciencias Administrativas, Contables y Económicas': [
    'Administración de Empresas',
    'Administración de Empresas Turísticas y Hoteleras',
    'Comercio Internacional',
    'Contaduría Pública',
    'Economía',
  ],
  'Bellas Artes': ['Licenciatura en Artes', 'Música'],
  'Ciencias Básicas': ['Microbiología'],
  'Derecho, Ciencias Políticas y Sociales': ['Derecho', 'Psicología', 'Sociología'],
  Educación: [
    'Licenciatura en Ciencias Naturales y Educación Ambiental',
    'Licenciatura en Educación Física, Recreación y Deportes',
    'Licenciatura en Español e Inglés',
    'Licenciatura en Literatura y Lengua Castellana',
    'Licenciatura en Matemáticas',
  ],
  'Ingenierías y Tecnologías': [
    'Ingeniería Agroindustrial',
    'Ingeniería Agropecuaria (Aguachica)',
    'Ingeniería Civil (Aguachica)',
    'Ingeniería Ambiental y Sanitaria',
    'Ingeniería de Sistemas',
    'Ingeniería Electrónica',
  ],
  'Ciencias de la Salud': ['Enfermería', 'Fisioterapia', 'Instrumentación Quirúrgica'],
};

/** Facultades de la UPC, en el orden de PROGRAMAS_POR_FACULTAD. */
export const FACULTADES: readonly string[] = Object.keys(PROGRAMAS_POR_FACULTAD);

/** Sedes de la Universidad (provisional). */
export const SEDES: readonly string[] = ['Valledupar', 'Aguachica'];

/** Niveles de formación, con el tipo que usa `Usuario.nivel` (#278: el Backend añadió «otro»). */
export const NIVELES_FORMACION: readonly NivelFormacion[] = ['pregrado', 'posgrado', 'otro'];

/** Nombre que se muestra de cada nivel de formación. */
export const NOMBRE_NIVEL_FORMACION: Record<NivelFormacion, string> = {
  pregrado: 'Pregrado',
  posgrado: 'Posgrado',
  otro: 'Otro',
};

/**
 * Semestres del I al X, como los escribe la biblioteca (provisional). Es la lista para mostrar;
 * lo que se guarda en `semestre` es el número, así que el formulario usa la posición + 1.
 * Hay estudiantes que pasan del X: hasta SEMESTRE_MAXIMO se eligen con «Otro» (#203).
 */
export const SEMESTRES: readonly string[] = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
];

/**
 * El semestre más alto que se acepta (#203): hay estudiantes en 11.º o 12.º. Del 1 al X salen en
 * la lista; del 11 a este, con «Otro». El Backend acepta hasta 2 cifras; el tope solo evita un
 * error de dedo, y no se muestra (#251: María lo subió de 14 a 20, «uno nunca sabe»).
 */
export const SEMESTRE_MAXIMO = 20;

/**
 * Duración de una asesoría, en minutos, igual para todas (#248).
 *
 * @deprecated Desde la versión 1.1 la duración la fija `Parametros.duracionAsesoriaMinutos`
 * (`advisory-duration-minutes` del Backend, #278), que la biblioteca puede cambiar.
 */
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
 * Términos de las solicitudes de formación (capacitaciones), adaptados de los formularios de
 * referencia de la biblioteca (#224). Texto de referencia: confirmarlo con la biblioteca.
 */
export const TERMINOS_FORMACION =
  'La revisión de normas APA se hace en una sesión por documento. ' +
  'Las capacitaciones se dictan dentro del espacio académico y con el acompañamiento ' +
  'del docente. ' +
  'Para las capacitaciones se necesita el usuario y la contraseña del sistema académico. ' +
  'La solicitud se hace con 3 días de anticipación y no garantiza la fecha pedida. ' +
  'La biblioteca confirma la solicitud por teléfono.';

/**
 * Términos de la reserva de espacios, adaptados de los formularios de referencia de la
 * biblioteca (#224). Texto de referencia: confirmarlo con la biblioteca.
 */
export const TERMINOS_ESPACIOS =
  'La reserva está sujeta a la disponibilidad del espacio. ' +
  'Dentro del espacio solo se permite consumir agua. ' +
  'El espacio se entrega en las mismas condiciones en que se recibió. ' +
  'El volumen de los equipos de sonido no puede pasar de 60. ' +
  'La biblioteca confirma la reserva por teléfono y por correo.';

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
