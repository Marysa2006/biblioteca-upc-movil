/**
 * Validación del formulario de espacios y de su fotografía (HU-16, CA2). Funciones puras, sin hooks.
 */
import { z } from 'zod';

/** Capacidad máxima que se acepta en el formulario: evita errores de digitación (400 en vez de 40). */
export const CAPACIDAD_MAXIMA = 300;

/** Fotografía: formatos, peso y tamaño mínimo para que se vea bien en la tarjeta. */
export const FOTO = {
  tipos: ['image/jpeg', 'image/png', 'image/webp'],
  extensiones: /\.(jpe?g|png|webp)$/i,
  pesoMaximoMb: 5,
  anchoMinimo: 400,
  altoMinimo: 300,
} as const;

/** Lo que entrega el selector de imágenes sobre la foto elegida. */
export type DatosFoto = {
  uri: string;
  mimeType?: string | null;
  fileSize?: number;
  width: number;
  height: number;
};

/**
 * Motivo por el que la foto no sirve, o null si sirve (CA2).
 * El ancho, el alto y el peso pueden venir en 0 o vacíos si el celular no los informa: entonces no se validan.
 */
export function problemaFoto(foto: DatosFoto): string | null {
  const tipoValido = foto.mimeType
    ? (FOTO.tipos as readonly string[]).includes(foto.mimeType)
    : FOTO.extensiones.test(foto.uri);
  if (!tipoValido) {
    return 'La foto debe ser JPG, PNG o WEBP.';
  }
  if (foto.fileSize && foto.fileSize > FOTO.pesoMaximoMb * 1024 * 1024) {
    return `La foto pesa más de ${FOTO.pesoMaximoMb} MB. Elige una más liviana.`;
  }
  if (
    foto.width > 0 &&
    foto.height > 0 &&
    (foto.width < FOTO.anchoMinimo || foto.height < FOTO.altoMinimo)
  ) {
    return `La foto es muy pequeña: debe medir al menos ${FOTO.anchoMinimo} × ${FOTO.altoMinimo} px.`;
  }
  return null;
}

const texto = (campo: string, maximo: number) =>
  z
    .string()
    .trim()
    .min(1, { error: `Escribe ${campo}.` })
    .max(maximo, { error: `Máximo ${maximo} caracteres.` });

/**
 * Validación del formulario de espacio (HU-16, CA2). La capacidad se escribe como texto
 * y la pantalla la convierte a número al guardar.
 */
export const esquemaEspacio = z.object({
  nombre: texto('el nombre del espacio', 80),
  descripcion: texto('la descripción', 300),
  capacidad: z
    .string()
    .trim()
    .regex(/^\d+$/, { error: 'Escribe la capacidad en números, sin puntos ni letras.' })
    .refine((valor) => Number(valor) >= 1, { error: 'La capacidad debe ser al menos 1 persona.' })
    .refine((valor) => Number(valor) <= CAPACIDAD_MAXIMA, {
      error: `La capacidad no puede pasar de ${CAPACIDAD_MAXIMA} personas.`,
    }),
  horario: texto('el horario', 150),
  /** Vacío = sin foto. */
  foto: z.string(),
  activo: z.boolean(),
});

export type DatosFormularioEspacio = z.infer<typeof esquemaEspacio>;
