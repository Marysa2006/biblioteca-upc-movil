/**
 * Pantallas de entrega y devolución de tablets (HU-23): grupos de la lista, tiempos, faltantes
 * y validación de los formularios. Funciones puras, sin hooks.
 * Las reglas del préstamo (retraso, estado de la tablet) están en src/utils/tablets.ts (Jorge).
 */
import { z } from 'zod';

import type { CondicionTablet, EstadoPrestamo, Prestamo } from '@/types';
import { fechaLegible } from '@/utils/fechas';
import { minutosDeRetraso } from '@/utils/tablets';

export const NOMBRE_CONDICION: Record<CondicionTablet, string> = {
  bueno: 'Bueno',
  regular: 'Regular',
  danado: 'Dañado',
};

export const AYUDA_CONDICION: Record<CondicionTablet, string> = {
  bueno: 'Sin marcas ni fallas.',
  regular: 'Funciona, con desgaste o marcas leves.',
  danado: 'Golpe, pantalla rota o no enciende.',
};

/** Grupos de la sección Préstamos: lo que hay que entregar, lo que hay que recibir y lo cerrado. */
export type GrupoPrestamos = 'entregar' | 'recibir' | 'devueltos';

export const ESTADOS_DE_GRUPO: Record<GrupoPrestamos, readonly EstadoPrestamo[]> = {
  entregar: ['reservado'],
  recibir: ['entregado', 'vencido'],
  devueltos: ['devuelto'],
};

export const NOMBRE_GRUPO: Record<GrupoPrestamos, string> = {
  entregar: 'Entregar',
  recibir: 'Recibir',
  devueltos: 'Historial',
};

/** Préstamos de un grupo: los pendientes, del más antiguo al más nuevo; los cerrados, al revés. */
export function prestamosDeGrupo(prestamos: Prestamo[], grupo: GrupoPrestamos): Prestamo[] {
  const clave = (p: Prestamo) => `${p.fecha} ${p.horaInicio}`;
  return prestamos
    .filter((prestamo) => ESTADOS_DE_GRUPO[grupo].includes(prestamo.estado))
    .sort((a, b) => (grupo === 'devueltos' ? clave(b).localeCompare(clave(a)) : clave(a).localeCompare(clave(b))));
}

/** 'AAAA-MM-DD HH:MM' → "24 de octubre, 15:05". */
export function fechaHoraLegible(fechaHora: string): string {
  const [fecha, hora] = fechaHora.split(' ');
  return `${fechaLegible(fecha)}, ${hora}`;
}

/** 135 → "2 h 15 min"; 40 → "40 min". */
export function duracionLegible(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

/**
 * Tiempo que le queda a un préstamo entregado o, si pasó la hora límite, el retraso (CA4).
 * Usa minutosDeRetraso() de Jorge, la misma regla que guarda la devolución.
 */
export function tiempoDelPrestamo(prestamo: Prestamo, ahora: Date = new Date()): { tarde: boolean; texto: string } {
  const retraso = minutosDeRetraso(prestamo, ahora);
  if (retraso > 0) return { tarde: true, texto: `Retrasada ${duracionLegible(retraso)}` };
  const limite = new Date(`${prestamo.fecha}T${prestamo.horaLimite}:00`);
  const restante = Math.max(0, Math.floor((limite.getTime() - ahora.getTime()) / 60000));
  return { tarde: false, texto: `Quedan ${duracionLegible(restante)}` };
}

/** Accesorios entregados que no volvieron (CA3). */
export function accesoriosFaltantes(entregados: string[], recibidos: string[]): string[] {
  const devueltos = new Set(recibidos.map((a) => a.trim()));
  return entregados.filter((accesorio) => !devueltos.has(accesorio.trim()));
}

const condicion = z.enum(['bueno', 'regular', 'danado'], { error: 'Elige el estado del equipo.' });

/**
 * Entrega (CA1): estado del equipo y accesorios entregados. Una tablet dañada no se entrega:
 * va a mantenimiento desde la sección Tablets.
 */
export const esquemaEntrega = z
  .object({ condicion, accesorios: z.array(z.string()) })
  .superRefine((datos, ctx) => {
    if (datos.condicion === 'danado') {
      ctx.addIssue({
        code: 'custom',
        path: ['condicion'],
        message: 'No entregues una tablet dañada: envíala a mantenimiento en la sección Tablets.',
      });
    }
  });

export type DatosFormularioEntrega = z.infer<typeof esquemaEntrega>;

/**
 * Devolución (CA2-CA3): estado, accesorios recibidos y novedades. Si volvió dañada o faltan
 * accesorios, la novedad es obligatoria y debe decir qué pasó (la API pide lo mismo).
 */
export function crearEsquemaDevolucion(accesoriosEntregados: string[]) {
  return z
    .object({
      condicion,
      accesorios: z.array(z.string()),
      novedades: z.string().trim().max(300, { error: 'Máximo 300 caracteres.' }),
    })
    .superRefine((datos, ctx) => {
      const faltan = accesoriosFaltantes(accesoriosEntregados, datos.accesorios);
      const hayNovedad = datos.condicion === 'danado' || faltan.length > 0;
      if (hayNovedad && datos.novedades.length < 10) {
        const motivo = [
          datos.condicion === 'danado' ? 'volvió dañada' : null,
          faltan.length > 0 ? `falta ${faltan.join(', ')}` : null,
        ]
          .filter(Boolean)
          .join(' y ');
        ctx.addIssue({
          code: 'custom',
          path: ['novedades'],
          message: `Describe la novedad (al menos 10 caracteres): ${motivo}.`,
        });
      }
    });
}

export type DatosFormularioDevolucion = z.infer<ReturnType<typeof crearEsquemaDevolucion>>;
