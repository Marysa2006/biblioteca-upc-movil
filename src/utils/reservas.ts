/**
 * Reglas de la bandeja de reservas del personal (HU-19). Funciones puras, sin hooks.
 * - Qué acciones tiene cada estado (CA1).
 * - Los motivos y la otra fecha se validan antes de enviar (CA2); la API vuelve a validar
 *   el motivo, los choques de horario (CA3) y que el día sea hábil (HU-28).
 */
import { z } from 'zod';

import type { Espacio, EstadoSolicitud, Parametros, RecursoApoyo, Reserva } from '@/types';
import { SEDES } from '@/utils/constantes';
import { esFechaValida, esHoraValida } from '@/utils/fechas';
import { motivoNoDisponible } from '@/utils/parametros';
import {
  camposSolicitante,
  campoTerminos,
  reglasSolicitante,
  VALORES_SOLICITANTE_VACIOS,
} from '@/utils/solicitante';

/** Lo que el personal decide sobre una solicitud; lo mismo que recibe useDecidirReserva(). */
export type AccionReserva = 'aprobar' | 'nueva_fecha' | 'rechazar' | 'cancelar';

/** Orden de los chips de la bandeja: primero lo que hay que atender. */
export const ORDEN_ESTADOS: EstadoSolicitud[] = [
  'pendiente',
  'nueva_fecha',
  'aprobada',
  'rechazada',
  'cancelada',
  'realizada',
];

/** Minúsculas y sin tildes, para que "sofia" encuentre "Sofía". */
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Las solicitudes cuya persona, espacio o propósito contienen el texto; sin texto, todas. */
export function buscarReservas(
  reservas: Reserva[],
  texto: string,
  nombreEspacio: (espacioId: string) => string,
): Reserva[] {
  const buscado = normalizar(texto);
  if (!buscado) return reservas;
  return reservas.filter((reserva) =>
    [reserva.solicitante, nombreEspacio(reserva.espacioId), reserva.proposito].some((campo) =>
      normalizar(campo).includes(buscado),
    ),
  );
}

/** Acciones de cada estado (CA1). Lo ya resuelto no tiene acciones. */
export const ACCIONES_POR_ESTADO: Record<EstadoSolicitud, AccionReserva[]> = {
  pendiente: ['aprobar', 'nueva_fecha', 'rechazar'],
  aprobada: ['nueva_fecha', 'cancelar'],
  nueva_fecha: ['nueva_fecha', 'cancelar'],
  rechazada: [],
  cancelada: [],
  realizada: [],
};

export const NOMBRE_ACCION: Record<AccionReserva, string> = {
  aprobar: 'Aprobar',
  nueva_fecha: 'Otra fecha',
  rechazar: 'Rechazar',
  cancelar: 'Cancelar',
};

const TITULO_AVISO: Record<AccionReserva, string> = {
  aprobar: 'Reserva aprobada',
  nueva_fecha: 'Nueva fecha propuesta',
  rechazar: 'Reserva rechazada',
  cancelar: 'Reserva cancelada',
};

/** "Reserva aprobada. Se notificó a Laura Pérez." (CA4). */
export function avisoDecision(accion: AccionReserva, solicitante: string): string {
  return `${TITULO_AVISO[accion]}. Se notificó a ${solicitante}.`;
}

const LARGO_MAXIMO_MOTIVO = 300;

/** CA2: rechazar o cancelar exige la justificación. */
export const esquemaMotivo = z.object({
  motivo: z
    .string()
    .trim()
    .min(1, { error: 'Escribe el motivo: la persona lo recibe en la notificación.' })
    .max(LARGO_MAXIMO_MOTIVO, { error: `Máximo ${LARGO_MAXIMO_MOTIVO} caracteres.` }),
});

export const esquemaMotivoOpcional = z.object({
  motivo: z.string().trim().max(LARGO_MAXIMO_MOTIVO),
});

export type FormularioMotivo = z.input<typeof esquemaMotivo>;

/** Otra fecha (CA1, "modificar"): fecha y horario válidos, con el fin después del inicio. */
export const esquemaOtraFecha = z
  .object({
    fecha: z.string().trim().refine(esFechaValida, { error: 'Elige una fecha en el calendario.' }),
    horaInicio: z.string().trim().refine(esHoraValida, { error: 'Elige una hora.' }),
    horaFin: z.string().trim().refine(esHoraValida, { error: 'Elige una hora.' }),
    motivo: z
      .string()
      .trim()
      .max(LARGO_MAXIMO_MOTIVO, { error: `Máximo ${LARGO_MAXIMO_MOTIVO} caracteres.` }),
  })
  .superRefine((datos, ctx) => {
    const horasValidas = esHoraValida(datos.horaInicio) && esHoraValida(datos.horaFin);
    if (horasValidas && datos.horaFin <= datos.horaInicio) {
      ctx.addIssue({
        code: 'custom',
        path: ['horaFin'],
        message: 'La hora de fin debe ser después de la de inicio.',
      });
    }
  });

export type FormularioOtraFecha = z.input<typeof esquemaOtraFecha>;

// ── Reglas de una reserva ─────────────────────────────────────────────────────────────
// Las comparten la solicitud de la comunidad (HU-18) y la reserva para terceros (HU-19):
// si una regla de la biblioteca cambia, cambia en los dos formularios. Cada formulario tiene
// su propio esquema con sus campos. Devuelven el mensaje para la persona o null.

/** Hasta cuántos meses adelante se puede elegir el día de una reserva en el calendario. */
export const MESES_RESERVA = 3;

/**
 * Por qué un día no se ofrece en el calendario de una reserva, o null si se puede elegir:
 * ya pasó o no es hábil (motivoNoDisponible, HU-28). Sin parámetros, solo los días pasados.
 */
export function motivoDiaReserva(
  dia: string,
  parametros: Parametros | undefined,
  hoy: string,
): string | null {
  if (dia < hoy) return 'ya pasó';
  return parametros ? motivoNoDisponible(dia, parametros) : null;
}

/** La fecha no pasó y es un día hábil (HU-28). Si falta la fecha, lo dice el campo. */
export function problemaFecha(fecha: string, parametros: Parametros, hoy: string): string | null {
  if (!esFechaValida(fecha)) return null;
  if (fecha < hoy) return 'La fecha ya pasó.';
  const motivo = motivoNoDisponible(fecha, parametros);
  return motivo ? `No disponible: ${motivo}.` : null;
}

type ProblemaHorario = { campo: 'horaInicio' | 'horaFin'; mensaje: string };

/** Horas en punto (las franjas son de una hora) y el fin después del inicio. */
export function problemaHorario(inicio: string, fin: string): ProblemaHorario | null {
  if (!esHoraValida(inicio) || !esHoraValida(fin)) return null;
  const enPunto = 'Usa horas en punto, por ejemplo 14:00.';
  if (!inicio.endsWith(':00')) return { campo: 'horaInicio', mensaje: enPunto };
  if (!fin.endsWith(':00')) return { campo: 'horaFin', mensaje: enPunto };
  if (fin <= inicio) {
    return { campo: 'horaFin', mensaje: 'La hora de fin debe ser después de la de inicio.' };
  }
  return null;
}

/**
 * Al menos 1 asistente (HU-18, CA3). La capacidad del espacio es orientativa: la biblioteca
 * agrega sillas si hace falta, así que no limita la reserva (15 de noviembre de 2026).
 */
export function problemaCapacidad(asistentes: string): string | null {
  if (!/^\d+$/.test(asistentes)) return null;
  if (Number(asistentes) < 1) return 'Debe asistir al menos 1 persona.';
  return null;
}

const LARGO_MAXIMO_PROPOSITO = 200;

/** Campos que tienen las dos reservas: la fecha y las horas se eligen, no se escriben. */
const camposReserva = {
  fecha: z.string().trim().refine(esFechaValida, { error: 'Elige una fecha en el calendario.' }),
  horaInicio: z.string().trim().refine(esHoraValida, { error: 'Elige una hora.' }),
  horaFin: z.string().trim().refine(esHoraValida, { error: 'Elige una hora.' }),
  proposito: z
    .string()
    .trim()
    .min(1, { error: 'Escribe el propósito de la reserva.' })
    .max(LARGO_MAXIMO_PROPOSITO, { error: `Máximo ${LARGO_MAXIMO_PROPOSITO} caracteres.` }),
  asistentes: z.string().trim().regex(/^\d+$/, { error: 'Escribe un número entero.' }),
  requerimientos: z
    .string()
    .trim()
    .max(LARGO_MAXIMO_MOTIVO, { error: `Máximo ${LARGO_MAXIMO_MOTIVO} caracteres.` }),
};

type DatosReglas = { fecha: string; horaInicio: string; horaFin: string; asistentes: string };

/** Aplica las tres reglas y marca el error en su campo. */
function aplicarReglas(
  datos: DatosReglas,
  ctx: z.RefinementCtx,
  { parametros, hoy }: { parametros: Parametros; hoy: string },
) {
  const fecha = problemaFecha(datos.fecha, parametros, hoy);
  if (fecha) ctx.addIssue({ code: 'custom', path: ['fecha'], message: fecha });

  const horario = problemaHorario(datos.horaInicio, datos.horaFin);
  if (horario) ctx.addIssue({ code: 'custom', path: [horario.campo], message: horario.mensaje });

  const capacidad = problemaCapacidad(datos.asistentes);
  if (capacidad) ctx.addIssue({ code: 'custom', path: ['asistentes'], message: capacidad });
}

/** Lo que necesita el esquema de la reserva para terceros para validar el día y la capacidad. */
type ContextoReserva = { parametros: Parametros; espacios: Espacio[]; hoy: string };

/**
 * Reserva que el personal crea en nombre de otra persona (HU-19).
 * Valida antes de enviar las reglas de la reserva; la API vuelve a validar el día hábil y los
 * choques de horario (CA3).
 */
export function esquemaReservaTercero({ parametros, hoy }: ContextoReserva, porCorreo = false) {
  return z
    .object({
      solicitanteId: porCorreo
        ? z.string()
        : z.string().min(1, { error: 'Elige a la persona que reserva.' }),
      correoSolicitante: porCorreo
        ? z
            .string()
            .trim()
            .email('Escribe un correo válido.')
            .refine(
              (correo) => correo.toLowerCase().endsWith('@unicesar.edu.co'),
              'Usa un correo institucional.',
            )
        : z.string(),
      espacioId: z.string().min(1, { error: 'Elige el espacio.' }),
      ...camposReserva,
    })
    .superRefine((datos, ctx) => aplicarReglas(datos, ctx, { parametros, hoy }));
}

export type FormularioReservaTercero = z.input<ReturnType<typeof esquemaReservaTercero>>;

/** Lo que necesita el esquema de la solicitud para validar el día y la capacidad. */
type ContextoSolicitud = { parametros: Parametros; espacio: Espacio; hoy: string };

/**
 * Solicitud de reserva de la comunidad (HU-18): el espacio ya viene del calendario y el
 * solicitante sale de la sesión. Valida antes de enviar las reglas de la reserva (CA3: al menos
 * 1 asistente; la capacidad ya no limita); la API vuelve a validar y responde la disponibilidad
 * con alternativas (CA2).
 */
export function esquemaSolicitudReserva({ parametros, hoy }: ContextoSolicitud) {
  return z
    .object(camposReserva)
    .superRefine((datos, ctx) => aplicarReglas(datos, ctx, { parametros, hoy }));
}

export type FormularioSolicitud = z.input<ReturnType<typeof esquemaSolicitudReserva>>;

// ── Versión 1.1: solicitud completa (#224) ───────────────────────────────────────────

export const LARGO_MAXIMO_NOVEDADES_RESERVA = 500;

/** Recursos de apoyo que se pueden pedir con el espacio; no elegir ninguno es la lista vacía. */
export const RECURSOS_APOYO: { valor: RecursoApoyo; etiqueta: string }[] = [
  { valor: 'portatil', etiqueta: 'Portátil' },
  { valor: 'hdmi', etiqueta: 'Cable HDMI' },
  { valor: 'cable_red', etiqueta: 'Cable de red' },
  { valor: 'mouse', etiqueta: 'Mouse' },
  { valor: 'marcadores', etiqueta: 'Marcadores' },
];

/**
 * Los recursos pedidos, para mostrarlos (#251): "Portátil, Mouse", "No requiere" si la lista está
 * vacía, o null si la reserva es de antes de la versión 1.1 y no los trae.
 */
export function textoRecursos(recursos: readonly RecursoApoyo[] | undefined): string | null {
  if (recursos == null) return null;
  if (recursos.length === 0) return 'No requiere';
  return recursos
    .map(
      (recurso) => RECURSOS_APOYO.find((opcion) => opcion.valor === recurso)?.etiqueta ?? recurso,
    )
    .join(', ');
}

/**
 * La sede del espacio que se envía con la reserva: la que dice el espacio o, si no la dice, la
 * primera de SEDES (Valledupar). El formulario no la pregunta (#251).
 */
export function sedeDeEspacio(espacio: Pick<Espacio, 'sede'>): string {
  return espacio.sede ?? SEDES[0];
}

/** La sede es una de SEDES y, si el espacio dice su sede, la misma. */
export function problemaSede(
  sede: string,
  espacio?: Pick<Espacio, 'nombre' | 'sede'>,
): string | null {
  if (!SEDES.includes(sede)) return 'Elige la sede.';
  if (espacio?.sede && espacio.sede !== sede) {
    return `${espacio.nombre} queda en la sede ${espacio.sede}.`;
  }
  return null;
}

/** Solo recursos de la lista. */
export function problemaRecursos(recursos: readonly string[]): string | null {
  const validos = recursos.every((recurso) =>
    RECURSOS_APOYO.some((opcion) => opcion.valor === recurso),
  );
  return validos ? null : 'Elige los recursos de la lista.';
}

/**
 * Solicitud completa de la versión 1.1 (#224, la UI es #251): los campos de HU-18 más los
 * recursos de apoyo, los datos del solicitante con su identificación (NIP) y los términos
 * (TERMINOS_ESPACIOS). `requerimientos` es el campo «Novedades». Los asistentes siguen sin
 * máximo: la capacidad del espacio es orientativa (problemaCapacidad).
 *
 * `sede` en el formulario es la de la persona (datos del solicitante, #251). La sede del espacio
 * no se pregunta: el formulario la envía aparte (la del espacio o la primera de SEDES), y la API
 * la revisa con problemaSede().
 */
export function esquemaSolicitudReservaCompleta({ parametros, hoy }: ContextoSolicitud) {
  return z
    .object({
      ...camposReserva,
      ...camposSolicitante,
      recursos: z.array(z.string()),
      requerimientos: z
        .string()
        .trim()
        .max(LARGO_MAXIMO_NOVEDADES_RESERVA, {
          error: `Máximo ${LARGO_MAXIMO_NOVEDADES_RESERVA} caracteres.`,
        }),
      terminosAceptados: campoTerminos,
    })
    .superRefine((datos, ctx) => {
      aplicarReglas(datos, ctx, { parametros, hoy });
      reglasSolicitante(datos, ctx, { pedirIdentificacion: true, pedirSede: true });
      const recursos = problemaRecursos(datos.recursos);
      if (recursos) ctx.addIssue({ code: 'custom', path: ['recursos'], message: recursos });
    });
}

export type FormularioSolicitudCompleta = z.input<
  ReturnType<typeof esquemaSolicitudReservaCompleta>
>;

/**
 * Valores iniciales sin el día ni las horas, que vienen del calendario. Los datos del solicitante
 * (con su sede) se prellenan con datosSolicitanteDe() (utils/solicitante).
 */
export function valoresInicialesReservaCompleta(): Omit<
  FormularioSolicitudCompleta,
  'fecha' | 'horaInicio' | 'horaFin'
> {
  return {
    proposito: '',
    asistentes: '',
    requerimientos: '',
    ...VALORES_SOLICITANTE_VACIOS,
    recursos: [],
    terminosAceptados: false,
  };
}
