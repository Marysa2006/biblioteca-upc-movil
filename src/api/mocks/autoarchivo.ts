/** Orientación de prueba (HU-11), tomada del instructivo de la biblioteca (2026). */
import type { OrientacionAutoarchivo } from '../autoarchivo';

export const ORIENTACION_AUTOARCHIVO: OrientacionAutoarchivo = {
  titulo: 'Cómo depositar tu trabajo de grado en el Repositorio Institucional',
  actualizada: '2026-11-25',
  instructivo:
    'https://ipxtzpbontuugdvawnge.supabase.co/storage/v1/object/public/media/guides/instructivo-autoarchivo-2026.pdf',
  procedimiento: [
    'Regístrate en el repositorio (https://repositorio.unicesar.edu.co/register) y crea tu perfil.',
    'Escribe a biblioteca@unicesar.edu.co y pide acceso a la colección de tu programa.',
    'Espera de 2 a 5 días a que te habiliten y vuelve a iniciar sesión con tu cuenta del repositorio.',
    'Toca «Comenzar un nuevo envío» (o el botón +) y elige la comunidad y la colección de tu tipo de documento.',
    'Completa los metadatos; los campos con asterisco (*) son obligatorios.',
    'Sube el documento y la autorización, en ese orden, y describe cada archivo.',
    'Elige el acceso: abierto, o con embargo si hay derechos editoriales o patentes.',
    'Revisa el resumen, marca «Concedo la licencia» y toca «Completar envío» o «Depositar».',
  ],
  requisitos: [
    'Una cuenta del repositorio con acceso a la colección de tu programa (la habilita la biblioteca).',
    'El documento final de tu trabajo.',
    'La autorización de publicación.',
    'Si es un artículo ya publicado, revisa en Sherpa Romeo qué versión permite subir la editorial: la publicada o la aceptada (post-print).',
  ],
  formatos: [
    'PDF o PDF/A, sin contraseña ni restricciones de impresión.',
    'De preferencia un solo archivo, salvo que te pidan portada y contenido por separado.',
    'Nombres de los archivos: ApellidoApellido.2026 para el documento y Autorizacion.ApellidoApellido.2026 para la autorización, con los apellidos de quien deposita.',
    'Sin tildes, espacios, ñ ni caracteres especiales en el nombre del archivo.',
  ],
  metadatos: [
    'Autor(es)',
    'Título',
    'Fecha de publicación',
    'Tipo de documento',
    'Idioma',
    'Palabras clave',
    'Resumen',
    'Patrocinadores (opcional)',
  ],
};
