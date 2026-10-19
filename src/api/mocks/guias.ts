/**
 * DATOS DE PRUEBA de las guías de la biblioteca (HU-29).
 * Son contenidos que la biblioteca publica; una queda sin publicar para probar el filtro.
 * El texto es de ejemplo: la biblioteca entregará el contenido definitivo.
 */
import type { Guia } from '@/types';

export const GUIAS: Guia[] = [
  {
    id: 'guia-apa',
    titulo: 'Cómo citar en Normas APA 7',
    descripcion: 'Citas en el texto y lista de referencias, con ejemplos.',
    contenido: [
      'Normas APA 7 · Guía rápida',
      '',
      '1. Cita en el texto: (Autor, año, p. página) cuando sea textual.',
      '2. Cita narrativa: Autor (año) explica que…',
      '3. La lista de referencias va al final, en orden alfabético.',
      '4. Libro: Apellido, A. A. (Año). Título en cursiva. Editorial.',
      '5. Artículo: Apellido, A. A. (Año). Título del artículo. Nombre de la revista, volumen(número), páginas.',
      '',
      'Si tienes dudas, agenda una asesoría en la biblioteca.',
    ].join('\n'),
    actualizada: '2026-10-01',
    publicado: true,
  },
  {
    id: 'guia-mendeley',
    titulo: 'Mendeley: organiza tus referencias',
    descripcion: 'Instalación, importación de fuentes y citas automáticas.',
    contenido: [
      'Mendeley · Primeros pasos',
      '',
      '1. Crea tu cuenta en mendeley.com con el correo institucional.',
      '2. Instala Mendeley Reference Manager y el plugin para tu procesador de texto.',
      '3. Importa fuentes desde el catálogo o desde un PDF.',
      '4. Usa el plugin para insertar citas y generar la bibliografía.',
      '',
      'La biblioteca ofrece talleres de Mendeley cada mes.',
    ].join('\n'),
    actualizada: '2026-10-03',
    publicado: true,
  },
  {
    id: 'guia-busqueda',
    titulo: 'Cómo buscar información en el catálogo',
    descripcion: 'Búsqueda simple, avanzada y filtros del catálogo Koha.',
    contenido: [
      'Buscar en el catálogo de la biblioteca',
      '',
      '1. Entra al catálogo desde la app (Inicio → Catálogo).',
      '2. Escribe el título, el autor o un tema en la búsqueda simple.',
      '3. Usa la búsqueda avanzada para combinar autor, materia y año.',
      '4. Revisa la disponibilidad y la ubicación del ejemplar.',
      '5. Para préstamo, acércate al mostrador con tu carné.',
    ].join('\n'),
    actualizada: '2026-10-05',
    publicado: true,
  },
  {
    id: 'guia-borrador',
    titulo: 'Taller de bases de datos (borrador)',
    descripcion: 'Guía de prueba sin publicar: no debe aparecer en la app.',
    contenido: 'Contenido en revisión por la biblioteca.',
    actualizada: '2026-10-10',
    publicado: false,
  },
];
