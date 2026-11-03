/**
 * DATOS DE PRUEBA de la orientación de autoarchivo (HU-11).
 *
 * PROVISIONAL: el procedimiento, los requisitos, los formatos y los metadatos son de ejemplo.
 * La biblioteca entregará el texto definitivo (pendiente de María, documento de la iteración 4).
 * Es orientación para depositar un trabajo de grado, no un reglamento ni un formulario.
 */
import type { OrientacionAutoarchivo } from '../autoarchivo';

export const ORIENTACION_AUTOARCHIVO: OrientacionAutoarchivo = {
  titulo: 'Cómo depositar tu trabajo de grado en el Repositorio Institucional',
  actualizada: '2026-11-02',
  procedimiento: [
    'Revisa que cumples los requisitos de esta guía.',
    'Prepara el archivo final de tu trabajo en el formato aceptado.',
    'Reúne los metadatos: título, autores, director, programa, resumen y palabras clave.',
    'Ingresa al Repositorio Institucional con tu cuenta.',
    'Deposita el archivo y completa los metadatos en el formulario del repositorio.',
    'Revisa la confirmación del depósito; la biblioteca lo valida antes de publicarlo.',
  ],
  requisitos: [
    'El trabajo de grado está aprobado por tu programa.',
    'Tienes la autorización del director del trabajo para publicarlo.',
    'El archivo es la versión final, sin comentarios ni marcas de revisión.',
    'Los datos de autores y director están completos.',
  ],
  formatos: [
    'PDF como formato principal del documento.',
    'Si tu trabajo incluye anexos en otros formatos, consulta a la biblioteca si se aceptan.',
  ],
  metadatos: [
    'Título del trabajo.',
    'Autor o autores.',
    'Director del trabajo.',
    'Programa académico.',
    'Fecha de sustentación o de aprobación.',
    'Resumen.',
    'Palabras clave.',
  ],
};
