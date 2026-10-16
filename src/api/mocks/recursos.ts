/**
 * Bases de datos y recursos académicos de la Biblioteca UPC (HU-03).
 * Son los 25 recursos reales que ofrece la biblioteca, con sus enlaces de acceso.
 *
 * requiereCuenta: true → sin sesión, la app pide iniciar sesión antes de abrirlo (CA3).
 * Los sitios públicos donde se puede buscar y leer resúmenes (Springer, SAGE, Oxford, Nature,
 * LA Referencia) van con false: el propio sitio pide el acceso cuando el texto completo depende
 * de la suscripción de la universidad.
 *
 * ScienceDirect, Scopus y Taylor & Francis abren la página de la UPC que explica cómo entrar
 * desde fuera del campus. Nursing@Ovid y vLex abren su entrada general, que pide su propio ingreso.
 */
import type { Recurso } from '@/types';

/** Página de la UPC con las instrucciones de acceso externo a las bases suscritas. */
const ACCESO_EXTERNO_UPC = 'https://www.unicesar.edu.co/bibliotecas-con-acceso-externo/';

export const RECURSOS: Recurso[] = [
  {
    id: 'elibro',
    nombre: 'eLibro',
    descripcion: 'Libros electrónicos académicos en español de todas las áreas.',
    url: 'https://elibro.net/es/lc/biblioupc/inicio',
    requiereCuenta: true,
  },
  {
    id: 'ebook-central',
    nombre: 'ProQuest Ebook Central',
    descripcion: 'Libros electrónicos académicos de editoriales internacionales.',
    url: 'https://ebookcentral.proquest.com/auth/lib/biblioupcsp/login.action?returnURL=https%3A%2F%2Febookcentral.proquest.com%2Flib%2Fbiblioupcsp%2Fhome.action',
    requiereCuenta: true,
  },
  {
    id: 'la-referencia',
    nombre: 'LA Referencia',
    descripcion: 'Repositorios de acceso abierto de América Latina: tesis, artículos y más.',
    url: 'https://www.lareferencia.info/es/home',
    requiereCuenta: false,
  },
  {
    id: 'ambientalex',
    nombre: 'Ambientalex',
    descripcion: 'Normativa y jurisprudencia ambiental de Colombia.',
    url: 'https://unicesar.ambientalex.info/',
    requiereCuenta: true,
  },
  {
    id: 'proquest-central',
    nombre: 'ProQuest Central',
    descripcion: 'Revistas, tesis y periódicos de todas las disciplinas.',
    url: 'https://www.proquest.com/centralpremium/?accountid=45678',
    requiereCuenta: true,
  },
  {
    id: 'sciencedirect',
    nombre: 'ScienceDirect',
    descripcion: 'Revistas y libros científicos de Elsevier.',
    url: ACCESO_EXTERNO_UPC,
    requiereCuenta: true,
  },
  {
    id: 'nursing-ovid',
    nombre: 'Nursing@Ovid',
    descripcion: 'Libros y revistas de enfermería.',
    url: 'https://ovidsp.ovid.com/',
    requiereCuenta: true,
  },
  {
    id: 'scopus',
    nombre: 'Scopus',
    descripcion: 'Resúmenes y citas de literatura científica revisada por pares.',
    url: ACCESO_EXTERNO_UPC,
    requiereCuenta: true,
  },
  {
    id: 'arancel-legis',
    nombre: 'Arancel Electrónico Legis',
    descripcion: 'Arancel de aduanas de Colombia, actualizado.',
    url: 'https://arancel.legis.com.co/Home/index',
    requiereCuenta: true,
  },
  {
    id: 'legiscomex',
    nombre: 'Legiscomex',
    descripcion: 'Información de comercio exterior: importaciones y exportaciones.',
    url: 'https://www.legiscomex.com/',
    requiereCuenta: true,
  },
  {
    id: 'legis-xperta',
    nombre: 'Legis Xperta',
    descripcion: 'Legislación, jurisprudencia y doctrina colombiana.',
    url: 'https://xperta.legis.co/home',
    requiereCuenta: true,
  },
  {
    id: 'legis-gestion-humana',
    nombre: 'Legis Gestión Humana',
    descripcion: 'Normativa y herramientas de gestión del talento humano.',
    url: 'https://www.gestionhumana.com/',
    requiereCuenta: true,
  },
  {
    id: 'ebooks-7-24',
    nombre: 'eBooks 7-24',
    descripcion: 'Libros electrónicos técnicos y profesionales en español.',
    url: 'https://www.ebooks7-24.com/biblioteca.aspx',
    requiereCuenta: true,
  },
  {
    id: 'clinicalkey-nursing',
    nombre: 'ClinicalKey Student Nursing',
    descripcion: 'Recursos de estudio de enfermería: libros, videos y casos.',
    url: 'https://www.clinicalkey.com/student/nursing/login',
    requiereCuenta: true,
  },
  {
    id: 'vlex',
    nombre: 'vLex',
    descripcion: 'Legislación, jurisprudencia y doctrina jurídica internacional.',
    url: 'https://vlex.com/',
    requiereCuenta: true,
  },
  {
    id: 'taylor-francis',
    nombre: 'Taylor & Francis Online',
    descripcion: 'Revistas académicas de ciencias sociales, humanidades y ciencias.',
    url: ACCESO_EXTERNO_UPC,
    requiereCuenta: true,
  },
  {
    id: 'springerlink',
    nombre: 'SpringerLink',
    descripcion: 'Revistas y libros científicos de Springer.',
    url: 'https://link.springer.com/',
    requiereCuenta: false,
  },
  {
    id: 'sage-journals',
    nombre: 'SAGE Journals',
    descripcion: 'Revistas académicas de ciencias sociales y de la salud.',
    url: 'https://journals.sagepub.com/',
    requiereCuenta: false,
  },
  {
    id: 'sage-knowledge',
    nombre: 'SAGE Knowledge',
    descripcion: 'Libros, enciclopedias y guías de investigación de SAGE.',
    url: 'https://search.sagepub.com/',
    requiereCuenta: false,
  },
  {
    id: 'oxford',
    nombre: 'Oxford University Press',
    descripcion: 'Revistas académicas de Oxford, de la A a la Z.',
    url: 'https://academic.oup.com/journals/pages/journals_a_to_z',
    requiereCuenta: false,
  },
  {
    id: 'nature',
    nombre: 'Nature',
    descripcion: 'Revista científica internacional y sus publicaciones.',
    url: 'https://www.nature.com/',
    requiereCuenta: false,
  },
  {
    id: 'magisterio',
    nombre: 'Magisterio',
    descripcion: 'Biblioteca digital de educación y pedagogía.',
    url: 'https://bibliotecadigital.magisterio.co/',
    requiereCuenta: true,
  },
  {
    id: 'yoleo',
    nombre: 'yoleo.online',
    descripcion: 'Libros electrónicos de literatura y lectura.',
    url: 'https://biblioteca.yoleo.online/',
    requiereCuenta: true,
  },
  {
    id: 'ediciones-de-la-u',
    nombre: 'Ediciones de la U',
    descripcion: 'Libros digitales universitarios de Ediciones de la U.',
    url: 'https://librosdigitales.edicionesdelau.com/library',
    requiereCuenta: true,
  },
  {
    id: 'bibliotele',
    nombre: 'Bibliotele',
    descripcion: 'Biblioteca digital de libros y audiolibros.',
    url: 'https://bibliotele.com/',
    requiereCuenta: true,
  },
];
