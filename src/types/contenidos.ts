/**
 * Contenidos del portal (HU-04).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 */

/** Tipo de contenido editable del portal (HU-04). */
export type TipoContenido = 'servicio' | 'informativo' | 'aviso';

/**
 * Contenido del portal que el administrador puede crear, editar, publicar,
 * ocultar y ordenar sin tocar el código (HU-04).
 */
export type Contenido = {
  id: string;
  tipo: TipoContenido;
  titulo: string;
  descripcion: string;
  publicado: boolean;
  orden: number;
  /** Vigencia opcional, sobre todo para los avisos. */
  fechaInicio?: string;
  fechaFin?: string;
};

/** Aviso del portal (HU-04): un contenido de tipo aviso. */
export type Aviso = Contenido & { tipo: 'aviso' };
