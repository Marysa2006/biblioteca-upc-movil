/**
 * Validación de los datos editables del perfil (HU-06). Funciones puras, sin hooks.
 * Repite la regla del teléfono de src/api/perfil.ts para avisar antes de enviar (CA4): la misma
 * del Backend y de las solicitudes, un celular de 10 dígitos que empieza por 3.
 */
import { z } from 'zod';

import { CELULAR, MENSAJE_CELULAR } from './solicitante';

export const LARGO_MAXIMO_DIRECCION = 120;

/**
 * Quita lo que la persona haya escrito para separar o adornar el número: espacios, guiones y el
 * indicativo +57, como hace el Backend.
 */
export const limpiarTelefono = (telefono: string) =>
  telefono.replace(/[\s-]+/g, '').replace(/^\+57/, '');

export const esquemaPerfil = z.object({
  telefono: z.string().refine(
    (texto) => {
      const limpio = limpiarTelefono(texto);
      return limpio === '' || CELULAR.test(limpio);
    },
    { error: MENSAJE_CELULAR },
  ),
  direccion: z
    .string()
    .trim()
    .max(LARGO_MAXIMO_DIRECCION, {
      error: `La dirección puede tener máximo ${LARGO_MAXIMO_DIRECCION} caracteres.`,
    }),
});

export type DatosFormularioPerfil = z.infer<typeof esquemaPerfil>;
