/**
 * Datos de quien pide un servicio (versión 1.1, #224): los mismos campos y reglas en los
 * formularios de capacitación, reserva de espacio y asesoría (#248). Funciones puras, sin hooks.
 * - `camposSolicitante`: los campos Zod que se suman al esquema de cada formulario.
 * - `reglasSolicitante()`: las reglas entre campos, para el `superRefine` de cada formulario.
 * - `datosSolicitanteDe()`: lo que ya se sabe de la sesión, para prellenar el formulario.
 * - `aDatosSolicitante()` y `problemaSolicitante()`: lo que guarda y valida la API.
 * En el formulario todo es texto; en la solicitud se guarda `DatosSolicitante` (contrato #247).
 */
import { z } from 'zod';

import type { DatosSolicitante, NivelFormacion, Perfil, TipoUsuario, Usuario } from '@/types';
import { NIVELES_FORMACION, SEMESTRES } from '@/utils/constantes';
import { aNombrePropio } from '@/utils/texto';

export const LARGO_MAXIMO_NOMBRE = 120;
export const LARGO_MAXIMO_DATO_ACADEMICO = 150;
const MENSAJE_MAXIMO_DATO_ACADEMICO = `Máximo ${LARGO_MAXIMO_DATO_ACADEMICO} caracteres.`;

const TIPOS_USUARIO: readonly string[] = [
  'estudiante',
  'docente',
  'administrativo',
  'egresado',
  'visitante',
] satisfies TipoUsuario[];

/** Celular colombiano: 10 dígitos que empiezan por 3. */
const CELULAR = /^3\d{9}$/;

const esCorreo = (valor: string) => z.email().safeParse(valor).success;
/** El semestre se guarda como número: del 1 (I) al 10 (X). */
const esSemestre = (valor: string) =>
  /^\d+$/.test(valor) && Number(valor) >= 1 && Number(valor) <= SEMESTRES.length;

/**
 * Campos del solicitante. `tipo` no lo escribe la persona: viene de la sesión y decide qué
 * datos académicos se piden. Lo que depende del tipo va en `reglasSolicitante()`.
 */
export const camposSolicitante = {
  tipo: z.string().refine((valor) => TIPOS_USUARIO.includes(valor), {
    error: 'No sabemos tu tipo de usuario. Vuelve a iniciar sesión.',
  }),
  nombreCompleto: z
    .string()
    .trim()
    .min(1, { error: 'Escribe tu nombre completo.' })
    .max(LARGO_MAXIMO_NOMBRE, { error: `Máximo ${LARGO_MAXIMO_NOMBRE} caracteres.` }),
  identificacion: z
    .string()
    .trim()
    .refine((valor) => valor === '' || /^\d+$/.test(valor), {
      error: 'Escribe la identificación solo con números.',
    }),
  correo: z
    .string()
    .trim()
    .min(1, { error: 'Escribe tu correo.' })
    .refine(esCorreo, { error: 'Escribe un correo válido, por ejemplo nombre@unicesar.edu.co.' }),
  celular: z
    .string()
    .trim()
    .min(1, { error: 'Escribe tu celular.' })
    .regex(CELULAR, { error: 'El celular debe tener 10 dígitos y empezar por 3.' }),
  // Texto y no z.enum: empieza vacío hasta que la persona elige.
  nivel: z
    .string()
    .refine((valor) => valor === '' || NIVELES_FORMACION.some((nivel) => nivel === valor), {
      error: 'Elige el nivel: pregrado o posgrado.',
    }),
  facultad: z
    .string()
    .trim()
    .max(LARGO_MAXIMO_DATO_ACADEMICO, { error: MENSAJE_MAXIMO_DATO_ACADEMICO }),
  programa: z
    .string()
    .trim()
    .max(LARGO_MAXIMO_DATO_ACADEMICO, { error: MENSAJE_MAXIMO_DATO_ACADEMICO }),
  semestre: z.string().refine((valor) => valor === '' || esSemestre(valor), {
    error: 'Elige un semestre del I al X.',
  }),
};

/** Aceptar los términos es obligatorio en los formularios que los muestran. */
export const campoTerminos = z.boolean().refine((valor) => valor, {
  error: 'Acepta los términos y condiciones para enviar la solicitud.',
});

const objetoSolicitante = z.object(camposSolicitante);

/** Lo que guarda el formulario: todo como texto. */
export type ValoresSolicitante = z.input<typeof objetoSolicitante>;

export const VALORES_SOLICITANTE_VACIOS: ValoresSolicitante = {
  tipo: '',
  nombreCompleto: '',
  identificacion: '',
  correo: '',
  celular: '',
  nivel: '',
  facultad: '',
  programa: '',
  semestre: '',
};

/** Qué pide cada formulario además de lo común. */
export type OpcionesSolicitante = {
  /** La reserva de espacio pide el NIP; la capacitación no. */
  pedirIdentificacion: boolean;
};

/**
 * Reglas entre campos: la identificación, cuando se pide, y los datos académicos de los
 * estudiantes (nivel, facultad, programa y semestre). Para el resto son opcionales, y el
 * semestre no se guarda (`aDatosSolicitante`).
 */
export function reglasSolicitante(
  datos: ValoresSolicitante,
  ctx: z.RefinementCtx,
  { pedirIdentificacion }: OpcionesSolicitante,
) {
  const falta = (campo: keyof ValoresSolicitante, mensaje: string) => {
    if (!datos[campo].trim()) ctx.addIssue({ code: 'custom', path: [campo], message: mensaje });
  };
  if (pedirIdentificacion) falta('identificacion', 'Escribe tu número de identificación.');
  if (datos.tipo === 'estudiante') {
    falta('nivel', 'Elige el nivel: pregrado o posgrado.');
    falta('facultad', 'Elige la facultad.');
    falta('programa', 'Escribe el programa.');
    falta('semestre', 'Elige el semestre.');
  }
}

/** El esquema del solicitante solo, con sus reglas; la API lo usa para validar. */
export function esquemaSolicitante(opciones: OpcionesSolicitante) {
  return objetoSolicitante.superRefine((datos, ctx) => reglasSolicitante(datos, ctx, opciones));
}

/**
 * Lo que ya se sabe de la persona, para prellenar el formulario: la cuenta y, si está, el perfil
 * (HU-06; su teléfono es el celular). No consulta la API ni inventa: lo que falta queda vacío.
 */
export function datosSolicitanteDe(usuario: Usuario, perfil?: Perfil): DatosSolicitante {
  const fuente: Usuario = { ...usuario, ...perfil };
  return {
    tipo: fuente.tipo,
    nombreCompleto: fuente.nombre,
    identificacion: fuente.identificacion ?? '',
    correo: fuente.correo,
    celular: perfil?.telefono ?? '',
    ...(fuente.nivel ? { nivel: fuente.nivel } : {}),
    ...(fuente.facultad ? { facultad: fuente.facultad } : {}),
    ...(fuente.programa ? { programa: fuente.programa } : {}),
    ...(fuente.semestre ? { semestre: fuente.semestre } : {}),
  };
}

/** Los datos guardados como texto del formulario (para prellenarlo o validarlos). */
export function valoresSolicitante(datos: Partial<DatosSolicitante>): ValoresSolicitante {
  return {
    tipo: datos.tipo ?? '',
    nombreCompleto: datos.nombreCompleto ?? '',
    identificacion: datos.identificacion ?? '',
    correo: datos.correo ?? '',
    celular: datos.celular ?? '',
    nivel: datos.nivel ?? '',
    facultad: datos.facultad ?? '',
    programa: datos.programa ?? '',
    semestre: datos.semestre ? String(datos.semestre) : '',
  };
}

/**
 * Lo que se guarda en la solicitud: el nombre como nombre propio, sin espacios de sobra y sin
 * campos vacíos. El semestre solo se guarda para los estudiantes.
 */
export function aDatosSolicitante(valores: ValoresSolicitante): DatosSolicitante {
  const facultad = valores.facultad.trim();
  const programa = valores.programa.trim();
  return {
    tipo: valores.tipo as TipoUsuario,
    nombreCompleto: aNombrePropio(valores.nombreCompleto),
    identificacion: valores.identificacion.trim(),
    correo: valores.correo.trim().toLowerCase(),
    celular: valores.celular.trim(),
    ...(valores.nivel ? { nivel: valores.nivel as NivelFormacion } : {}),
    ...(facultad ? { facultad } : {}),
    ...(programa ? { programa } : {}),
    ...(valores.tipo === 'estudiante' && valores.semestre
      ? { semestre: Number(valores.semestre) }
      : {}),
  };
}

/** El primer problema de los datos del solicitante que llegan a la API, o null. */
export function problemaSolicitante(
  datos: Partial<DatosSolicitante>,
  opciones: OpcionesSolicitante,
): string | null {
  const resultado = esquemaSolicitante(opciones).safeParse(valoresSolicitante(datos));
  return resultado.success ? null : (resultado.error.issues[0]?.message ?? 'Revisa tus datos.');
}
