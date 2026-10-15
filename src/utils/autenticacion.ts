/**
 * Validación del formulario de inicio de sesión (HU-05). Funciones puras, sin hooks.
 *
 * La persona escribe solo su usuario (laura.perez) y la app agrega @unicesar.edu.co.
 * Si pega el correo completo, se acepta igual, siempre que sea del dominio institucional.
 */
import { z } from 'zod';

import { DOMINIO_CORREO } from '@/utils/constantes';

const SUFIJO = `@${DOMINIO_CORREO}`;
const FORMATO_USUARIO = /^[a-z0-9._-]+$/i;

/** Parte del usuario antes de la @, si la tiene. */
const parteUsuario = (texto: string) => texto.split('@')[0];

export const esquemaLogin = z.object({
  usuario: z
    .string()
    .trim()
    .min(1, { error: 'Escribe tu usuario institucional.' })
    .refine((texto) => !texto.includes('@') || texto.toLowerCase().endsWith(SUFIJO), {
      error: `Usa tu correo institucional (${SUFIJO}).`,
    })
    .refine((texto) => FORMATO_USUARIO.test(parteUsuario(texto)), {
      error: 'Revisa tu usuario: solo letras, números, puntos, guiones o guiones bajos.',
    }),
  contrasena: z.string().min(1, { error: 'Escribe tu contraseña.' }),
});

export type DatosLogin = z.infer<typeof esquemaLogin>;

/** laura.perez → laura.perez@unicesar.edu.co. Un correo completo se deja tal cual. */
export function aCorreoInstitucional(usuario: string): string {
  const limpio = usuario.trim();
  return limpio.includes('@') ? limpio : `${limpio}${SUFIJO}`;
}
