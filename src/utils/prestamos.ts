/**
 * Pantallas de entrega y devolución de tablets (HU-23): grupos de la lista, tiempos, faltantes
 * y validación de los formularios. Funciones puras, sin hooks.
 * Las reglas del préstamo (retraso, estado de la tablet) están en src/utils/tablets.ts (Jorge).
 */
import { z } from 'zod';

import type { CondicionTablet, EstadoEquipo, EstadoPrestamo, Prestamo, Tablet } from '@/types';
import { NOTAS_PRESTAMO } from '@/utils/constantes';
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


/** Un dato de la constancia: la etiqueta del formato y su valor ya listo para mostrar. */
export type DatoConstancia = { etiqueta: string; valor: string };

/** La constancia del préstamo, en el orden del formato de la biblioteca (#252). */
export type ConstanciaPrestamo = {
  /** Fecha y hora del préstamo, 'AAAA-MM-DD HH:MM'. */
  prestamo: string;
  /** Fecha y hora de la devolución: la registrada, o la hora límite si aún no se devolvió. */
  devolucion: string;
  /** Quién recibe: nombres, identificación, programa y semestre. */
  usuario: DatoConstancia[];
  /** El dispositivo: tipo, marca, valor, código interno y serial. */
  dispositivo: DatoConstancia[];
  /** Estado del equipo al entregarlo, con las notas si es «otro». */
  estadoEquipo: string;
  notas: string;
  /** Quién entregó y quién recibió, con su cargo. */
  entrego?: string;
  recibio?: string;
  /** Las tres notas del formato, con el valor de la tablet en la tercera (CA3). */
  notasLegales: string[];
};

/**
 * Arma la constancia del préstamo en el orden del formato (CA1): los datos del usuario, el
 * dispositivo, el estado, las notas y quién entregó y recibió. Las firmas del papel se
 * reemplazan por quién hizo cada paso, que es lo que registra la app.
 *
 * Es pura: recibe el préstamo y la tablet, y no consulta nada.
 */
export function constanciaDe(prestamo: Prestamo, tablet: Tablet): ConstanciaPrestamo {
  const solicitante = prestamo.datosSolicitante;
  const entrega = prestamo.entrega;
  const devolucion = prestamo.devolucion;

  const usuario: DatoConstancia[] = [
    { etiqueta: 'Nombres', valor: solicitante?.nombreCompleto ?? prestamo.solicitante },
    { etiqueta: 'Identificación', valor: solicitante?.identificacion ?? 'Sin registrar' },
    { etiqueta: 'Programa', valor: solicitante?.programa ?? 'Sin registrar' },
    {
      etiqueta: 'Semestre',
      valor: solicitante?.semestre != null ? `${solicitante.semestre}.º` : 'Sin registrar',
    },
  ];

  const dispositivo: DatoConstancia[] = [
    { etiqueta: 'Tipo', valor: tablet.tipo ?? 'Tablet' },
    { etiqueta: 'Marca', valor: tablet.marca ?? 'Sin registrar' },
    { etiqueta: 'Valor del bien', valor: valorEnPesos(tablet.valor) },
    { etiqueta: 'Código interno', valor: tablet.codigo },
    { etiqueta: 'Serial', valor: tablet.serial },
  ];

  const notasLegales = notasDelPrestamo(tablet.valor);

  return {
    prestamo: `${prestamo.fecha} ${prestamo.horaInicio}`,
    devolucion: devolucion?.fechaHora ?? `${prestamo.fecha} ${prestamo.horaLimite}`,
    usuario,
    dispositivo,
    // Sin dato no se pone «Otro»: ese es un estado concreto y afirmarlo sería mentir.
    estadoEquipo: prestamo.estadoEquipo
      ? NOMBRE_ESTADO_EQUIPO[prestamo.estadoEquipo]
      : 'Sin registrar',
    notas: prestamo.notas ?? devolucion?.novedades ?? '',
    entrego: entrega?.responsable
      ? `${entrega.responsable.nombre}${entrega.responsable.cargo ? ` · ${entrega.responsable.cargo}` : ''}`
      : undefined,
    recibio: devolucion?.responsable
      ? `${devolucion.responsable.nombre}${devolucion.responsable.cargo ? ` · ${devolucion.responsable.cargo}` : ''}`
      : undefined,
    notasLegales,
  };
}

/** Nombre del estado del equipo como lo escribe el formato. */
export const NOMBRE_ESTADO_EQUIPO: Record<EstadoEquipo, string> = {
  nuevo: 'Nuevo',
  optimo: 'Óptimo',
  otro: 'Otro',
};

/** 1470000 → "$ 1.470.000". Sin decimales: el formato habla de pesos completos. */
export function valorEnPesos(valor: number | undefined): string {
  if (valor == null) return 'Sin registrar';
  return `$ ${valor.toLocaleString('es-CO')}`;
}

/**
 * Las tres notas del formato (CA3). La tercera lleva el valor del bien, que es el de la tablet
 * del préstamo; si no lo tiene, queda sin la cifra en vez de inventarla.
 */
export function notasDelPrestamo(valor: number | undefined): string[] {
  const [primera, segunda, tercera] = NOTAS_PRESTAMO;
  // La tercera del formato termina en «… el valor de este, que es de $ 1.470.000».
  const conValor =
    valor == null ? tercera : `${tercera.replace(/\.$/, '')}, que es de ${valorEnPesos(valor)}.`;
  return [primera, segunda, conValor];
}
