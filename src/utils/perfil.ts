/**
 * Validación de los datos editables del perfil (HU-06). Funciones puras, sin hooks.
 * Repite la regla del teléfono de src/api/perfil.ts para avisar antes de enviar (CA4).
 */
import { z } from 'zod';

/** Teléfono válido: solo dígitos, entre 7 y 10. Los espacios se quitan antes de validar. */
const TELEFONO_VALIDO = /^[0-9]{7,10}$/;
export const LARGO_MAXIMO_DIRECCION = 120;

/** Quita los espacios que la persona haya escrito para separar los números. */
export const limpiarTelefono = (telefono: string) => telefono.replace(/\s+/g, '');

export const esquemaPerfil = z.object({
  telefono: z.string().refine((texto) => {
    const limpio = limpiarTelefono(texto);
    return limpio === '' || TELEFONO_VALIDO.test(limpio);
  }, { error: 'El teléfono debe tener solo números, entre 7 y 10 dígitos.' }),
  direccion: z
    .string()
    .trim()
    .max(LARGO_MAXIMO_DIRECCION, {
      error: `La dirección puede tener máximo ${LARGO_MAXIMO_DIRECCION} caracteres.`,
    }),
});

export type DatosFormularioPerfil = z.infer<typeof esquemaPerfil>;
