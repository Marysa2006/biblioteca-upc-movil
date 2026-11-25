/**
 * Registro provisional de una cuenta de la comunidad (#203). Funciones puras, sin hooks: las usa
 * el formulario y el mock de `src/api/autenticacion.ts` valida con las mismas.
 *
 * Los campos son los de `POST register/` del Backend («Cambios del backend para frontend»,
 * noviembre de 2026, sección 1), para que conectar la API sea solo cambiar el mock:
 * - obligatorios: correo, contraseña, cédula, nombres, apellidos, tipo y la autorización;
 * - estudiantes: además, programa y semestre;
 * - opcionales: celular y dependencia.
 * La app además pide la sede (obligatoria para estudiantes) y, a los estudiantes, la facultad, con
 * las mismas listas de las solicitudes (#294). El Backend todavía no las recibe (#295): el mock las
 * guarda en la cuenta para prellenar las solicitudes, y no se envían a `POST register/`.
 * Solo estudiantes, docentes y administrativos se registran; los egresados y el personal no
 * (CA3: los roles los asigna la administración en Personal → Equipo).
 *
 * El documento no dice qué es una contraseña débil: la app pide lo mínimo razonable y, si el
 * servidor la rechaza, muestra su mensaje («lo más seguro es mostrar el mensaje de error que
 * devuelve el backend»).
 */
import { z } from 'zod';

import type { TipoUsuario } from '@/types';
import { DOMINIO_CORREO, SEDES } from '@/utils/constantes';
import {
  CELULAR,
  esCorreo,
  esSemestre,
  LARGO_MAXIMO_DATO_ACADEMICO,
  LARGO_MAXIMO_NOMBRE,
  MENSAJE_CELULAR,
  MENSAJE_SEMESTRE,
} from '@/utils/solicitante';
import { aNombrePropio } from '@/utils/texto';

/** Quién se puede registrar: `STUDENT`, `TEACHER` y `ADMINISTRATIVE` en el Backend. */
export const TIPOS_REGISTRO = ['estudiante', 'docente', 'administrativo'] as const;
export type TipoRegistro = (typeof TIPOS_REGISTRO)[number] & TipoUsuario;

/** Los nombres que manda el Backend en `user_type`. */
export const TIPO_BACKEND: Record<TipoRegistro, 'STUDENT' | 'TEACHER' | 'ADMINISTRATIVE'> = {
  estudiante: 'STUDENT',
  docente: 'TEACHER',
  administrativo: 'ADMINISTRATIVE',
};

export const LARGO_MINIMO_CONTRASENA = 8;
/** Cédula colombiana: hasta 15 dígitos, como en los formularios de solicitud. */
export const LARGO_MAXIMO_IDENTIFICACION = 15;

const sufijoCorreo = `@${DOMINIO_CORREO}`;

/** ¿El correo es institucional? Solo se acepta el dominio de la Universidad (400 en el Backend). */
export function esCorreoInstitucional(correo: string): boolean {
  return correo.trim().toLowerCase().endsWith(sufijoCorreo);
}

/** Por qué la contraseña no sirve, o null. El servidor puede pedir más y lo dice en su 400. */
export function problemaContrasena(contrasena: string): string | null {
  if (contrasena.length < LARGO_MINIMO_CONTRASENA) {
    return `Usa al menos ${LARGO_MINIMO_CONTRASENA} caracteres.`;
  }
  if (/^\d+$/.test(contrasena)) return 'La contraseña no puede tener solo números.';
  return null;
}

/** Todo es texto en el formulario; `aNuevaCuenta()` lo convierte en lo que se envía. */
const camposRegistro = {
  nombres: z
    .string()
    .trim()
    .min(1, { error: 'Escribe tus nombres.' })
    .max(LARGO_MAXIMO_NOMBRE, { error: `Máximo ${LARGO_MAXIMO_NOMBRE} caracteres.` }),
  apellidos: z
    .string()
    .trim()
    .min(1, { error: 'Escribe tus apellidos.' })
    .max(LARGO_MAXIMO_NOMBRE, { error: `Máximo ${LARGO_MAXIMO_NOMBRE} caracteres.` }),
  identificacion: z
    .string()
    .trim()
    .min(1, { error: 'Escribe tu número de cédula.' })
    .regex(/^\d+$/, { error: 'Escribe la cédula solo con números.' })
    .max(LARGO_MAXIMO_IDENTIFICACION, {
      error: `Máximo ${LARGO_MAXIMO_IDENTIFICACION} dígitos.`,
    }),
  correo: z
    .string()
    .trim()
    .min(1, { error: 'Escribe tu correo institucional.' })
    .refine(esCorreo, { error: `Escribe un correo válido, por ejemplo nombre${sufijoCorreo}.` })
    .refine(esCorreoInstitucional, { error: `Usa tu correo institucional (${sufijoCorreo}).` }),
  // Texto y no z.enum: empieza vacío hasta que la persona elige.
  tipo: z.string().refine((valor) => TIPOS_REGISTRO.some((tipo) => tipo === valor), {
    error: 'Elige si eres estudiante, docente o administrativo.',
  }),
  // La sede de la persona (#294), vacía hasta que se elige.
  sede: z.string().refine((valor) => valor === '' || SEDES.includes(valor), {
    error: 'Elige tu sede.',
  }),
  facultad: z
    .string()
    .trim()
    .max(LARGO_MAXIMO_DATO_ACADEMICO, {
      error: `Máximo ${LARGO_MAXIMO_DATO_ACADEMICO} caracteres.`,
    }),
  programa: z
    .string()
    .trim()
    .max(LARGO_MAXIMO_DATO_ACADEMICO, {
      error: `Máximo ${LARGO_MAXIMO_DATO_ACADEMICO} caracteres.`,
    }),
  semestre: z.string().refine((valor) => valor === '' || esSemestre(valor), {
    error: MENSAJE_SEMESTRE,
  }),
  dependencia: z
    .string()
    .trim()
    .max(LARGO_MAXIMO_DATO_ACADEMICO, {
      error: `Máximo ${LARGO_MAXIMO_DATO_ACADEMICO} caracteres.`,
    }),
  celular: z
    .string()
    .trim()
    .refine((valor) => valor === '' || CELULAR.test(valor), { error: MENSAJE_CELULAR }),
  contrasena: z.string(),
  confirmacion: z.string(),
  aceptaPrivacidad: z.boolean().refine((acepta) => acepta, {
    error: 'Autoriza el tratamiento de tus datos personales para crear la cuenta.',
  }),
};

/**
 * El formulario del registro. Las reglas entre campos van en superRefine: la sede, la facultad,
 * el programa y el semestre solo son obligatorios para estudiantes; la contraseña y su
 * confirmación, para todos.
 */
export const esquemaRegistro = z.object(camposRegistro).superRefine((datos, ctx) => {
  const error = (campo: keyof typeof camposRegistro, mensaje: string) =>
    ctx.addIssue({ code: 'custom', path: [campo], message: mensaje });

  if (datos.tipo === 'estudiante') {
    if (!datos.sede) error('sede', 'Elige tu sede.');
    if (!datos.facultad.trim()) error('facultad', 'Elige tu facultad.');
    if (!datos.programa.trim()) {
      error('programa', 'Elige tu programa o escríbelo en «Otro programa».');
    }
    if (!datos.semestre) error('semestre', 'Elige tu semestre.');
  }
  const problema = problemaContrasena(datos.contrasena);
  if (problema) error('contrasena', problema);
  if (!datos.confirmacion) error('confirmacion', 'Vuelve a escribir la contraseña.');
  else if (datos.confirmacion !== datos.contrasena) {
    error('confirmacion', 'Las contraseñas no coinciden.');
  }
});

export type FormularioRegistro = z.input<typeof esquemaRegistro>;

export const VALORES_INICIALES_REGISTRO: FormularioRegistro = {
  nombres: '',
  apellidos: '',
  identificacion: '',
  correo: '',
  tipo: '',
  sede: '',
  facultad: '',
  programa: '',
  semestre: '',
  dependencia: '',
  celular: '',
  contrasena: '',
  confirmacion: '',
  aceptaPrivacidad: false,
};

/** Los campos que la API puede rechazar con su mensaje (400 de `POST register/`). */
export type CampoRegistro = keyof FormularioRegistro;

/** Lo que se envía: `NuevaCuenta` en `src/api/autenticacion.ts`. */
export type NuevaCuenta = {
  nombres: string;
  apellidos: string;
  identificacion: string;
  correo: string;
  tipo: TipoRegistro;
  /** Para todos, opcional salvo para estudiantes (#294). */
  sede?: string;
  /** Solo estudiantes (#294). */
  facultad?: string;
  /** Solo estudiantes. */
  programa?: string;
  semestre?: number;
  /** Solo docentes y administrativos. */
  dependencia?: string;
  celular?: string;
  contrasena: string;
  aceptaPrivacidad: boolean;
};

/**
 * Del formulario a lo que se envía: nombres como nombre propio, el correo en minúsculas, sin
 * campos vacíos y sin los datos que no van con el tipo (la facultad, el programa y el semestre
 * son del estudiante; la dependencia, del docente o administrativo). La sede va con todos.
 */
export function aNuevaCuenta(valores: FormularioRegistro): NuevaCuenta {
  const tipo = valores.tipo as TipoRegistro;
  const facultad = valores.facultad.trim();
  const programa = valores.programa.trim();
  const dependencia = valores.dependencia.trim();
  const celular = valores.celular.trim();
  const esEstudiante = tipo === 'estudiante';
  return {
    nombres: aNombrePropio(valores.nombres),
    apellidos: aNombrePropio(valores.apellidos),
    identificacion: valores.identificacion.trim(),
    correo: valores.correo.trim().toLowerCase(),
    tipo,
    ...(valores.sede ? { sede: valores.sede } : {}),
    ...(esEstudiante && facultad ? { facultad } : {}),
    ...(esEstudiante && programa ? { programa } : {}),
    ...(esEstudiante && valores.semestre ? { semestre: Number(valores.semestre) } : {}),
    ...(!esEstudiante && dependencia ? { dependencia } : {}),
    ...(celular ? { celular } : {}),
    contrasena: valores.contrasena,
    aceptaPrivacidad: valores.aceptaPrivacidad,
  };
}

/** El primer problema de una cuenta que llega a la API, con su campo, o null. */
export function problemaNuevaCuenta(
  cuenta: NuevaCuenta,
): { campo: CampoRegistro; mensaje: string } | null {
  const resultado = esquemaRegistro.safeParse({
    ...VALORES_INICIALES_REGISTRO,
    ...cuenta,
    semestre: cuenta.semestre != null ? String(cuenta.semestre) : '',
    confirmacion: cuenta.contrasena,
  });
  if (resultado.success) return null;
  const [primero] = resultado.error.issues;
  return { campo: primero.path[0] as CampoRegistro, mensaje: primero.message };
}
