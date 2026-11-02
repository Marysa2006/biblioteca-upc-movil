/**
 * Pantallas del inventario de tablets (HU-21): nombres de estado, resumen de la flota,
 * filtro y validación del formulario. Funciones puras, sin hooks.
 * Las reglas de préstamo y disponibilidad están en src/utils/tablets.ts (Jorge).
 */
import { z } from 'zod';

import type { EstadoSolicitud, EstadoTablet, Tablet } from '@/types';

export const NOMBRE_ESTADO_TABLET: Record<EstadoTablet, string> = {
  disponible: 'Disponible',
  en_prestamo: 'En préstamo',
  mantenimiento: 'Mantenimiento',
  de_baja: 'De baja',
};

export const ICONO_ESTADO_TABLET: Record<EstadoTablet, string> = {
  disponible: 'check-circle-outline',
  en_prestamo: 'clock-outline',
  mantenimiento: 'wrench-outline',
  de_baja: 'archive-off-outline',
};

/** Color de cada estado, tomado de los estados de solicitud del tema (contraste AA). */
export const COLOR_ESTADO_TABLET: Record<EstadoTablet, EstadoSolicitud> = {
  disponible: 'aprobada',
  en_prestamo: 'nueva_fecha',
  mantenimiento: 'pendiente',
  de_baja: 'cancelada',
};

/**
 * Estados que se eligen a mano. 'en_prestamo' no: lo pone la entrega de HU-23 y lo quita la
 * devolución, para que el inventario no diga que una tablet está prestada sin un préstamo.
 */
export const ESTADOS_EDITABLES: EstadoTablet[] = ['disponible', 'mantenimiento', 'de_baja'];

/** Accesorios que se ofrecen como chips; se pueden agregar otros. */
export const ACCESORIOS_COMUNES = ['cargador', 'cable USB-C', 'estuche', 'lápiz', 'audífonos'];

export type ResumenFlota = Record<EstadoTablet, number> & { total: number };

/** Cuántas tablets hay en cada estado, para las tarjetas del resumen. */
export function resumenFlota(tablets: Tablet[]): ResumenFlota {
  const resumen: ResumenFlota = { total: tablets.length, disponible: 0, en_prestamo: 0, mantenimiento: 0, de_baja: 0 };
  for (const tablet of tablets) resumen[tablet.estado] += 1;
  return resumen;
}

/** Filtra por estado y por texto en el código, el serial o el modelo, sin tildes ni mayúsculas. */
export function filtrarTablets(tablets: Tablet[], estado: EstadoTablet | 'todas', busqueda: string): Tablet[] {
  const normalizar = (texto: string) =>
    texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const buscado = normalizar(busqueda);
  return tablets
    .filter((tablet) => estado === 'todas' || tablet.estado === estado)
    .filter(
      (tablet) =>
        buscado === '' ||
        [tablet.codigo, tablet.serial, tablet.modelo].some((campo) => normalizar(campo).includes(buscado)),
    )
    .sort((a, b) => a.codigo.localeCompare(b.codigo, 'es', { numeric: true }));
}

/** Código interno: letras, números y guiones, como TAB-001. */
const FORMATO_CODIGO = /^[A-Z0-9]+(-[A-Z0-9]+)*$/;
/** Serial del fabricante: letras, números y guiones. */
const FORMATO_SERIAL = /^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$/;

/**
 * Validación del formulario de tablet (HU-21). El código y el serial repetidos se marcan bajo
 * su propio campo (CA2), sin distinguir mayúsculas. La API vuelve a validar al guardar.
 */
export function crearEsquemaTablet(tablets: Tablet[], idActual?: string) {
  const otras = tablets.filter((tablet) => tablet.id !== idActual);
  return z
    .object({
      codigo: z
        .string()
        .trim()
        .min(3, { error: 'Escribe el código interno (al menos 3 caracteres).' })
        .max(20, { error: 'Máximo 20 caracteres.' })
        .transform((texto) => texto.toUpperCase())
        .refine((texto) => FORMATO_CODIGO.test(texto), {
          error: 'Usa letras, números y guiones, por ejemplo TAB-007.',
        }),
      serial: z
        .string()
        .trim()
        .min(5, { error: 'Escribe el serial del fabricante (al menos 5 caracteres).' })
        .max(40, { error: 'Máximo 40 caracteres.' })
        .refine((texto) => FORMATO_SERIAL.test(texto), {
          error: 'El serial solo lleva letras, números y guiones, sin espacios.',
        }),
      modelo: z
        .string()
        .trim()
        .min(3, { error: 'Escribe el modelo (al menos 3 caracteres).' })
        .max(60, { error: 'Máximo 60 caracteres.' }),
      accesorios: z.array(z.string().trim().min(1)).max(10, { error: 'Máximo 10 accesorios.' }),
      estado: z.enum(['disponible', 'en_prestamo', 'mantenimiento', 'de_baja']),
    })
    .superRefine((datos, ctx) => {
      const codigo = otras.find((tablet) => tablet.codigo.toUpperCase() === datos.codigo);
      if (codigo) {
        ctx.addIssue({
          code: 'custom',
          path: ['codigo'],
          message: `Ese código ya es de la tablet ${codigo.modelo} (${codigo.serial}). Corrígelo.`,
        });
      }
      const serial = otras.find((tablet) => tablet.serial.toLowerCase() === datos.serial.toLowerCase());
      if (serial) {
        ctx.addIssue({
          code: 'custom',
          path: ['serial'],
          message: `Ese serial ya está registrado en ${serial.codigo}. Corrígelo.`,
        });
      }
    });
}

export type DatosFormularioTablet = z.input<ReturnType<typeof crearEsquemaTablet>>;
