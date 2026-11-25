/**
 * Reglas de las citas de asesoría (HU-14). Funciones puras, sin hooks ni API: las usan los
 * componentes de src/components/asesorias y el mock puede usar las mismas para no repetirlas.
 *
 * El plazo para cancelar sale de parametros.horasMinimasCancelacion (HU-28). Reprogramar
 * libera la franja de antes, así que sigue el mismo plazo que cancelar.
 */
import { z } from 'zod';

import type {
  Cita,
  EstadoSolicitud,
  FranjaAsesoria,
  ModalidadAsesoria,
  NuevaSolicitudCita,
  Parametros,
  TemaAsesoria,
  Usuario,
} from '@/types';
import { LARGO_MAXIMO_ASIGNATURA, LARGO_MAXIMO_NOVEDADES } from '@/utils/capacitaciones';
import { esFechaValida, esHoraValida, hoyISO } from '@/utils/fechas';
import { aHora, aMinutos } from '@/utils/franjas';
import { horariosDeFecha, motivoNoDisponible } from '@/utils/parametros';
import { inicioReserva } from '@/utils/recordatorios';
import {
  aDatosSolicitante,
  camposSolicitante,
  campoTerminos,
  datosSolicitanteDe,
  LARGO_MAXIMO_NOMBRE,
  reglasSolicitante,
  VALORES_SOLICITANTE_VACIOS,
  type ValoresSolicitante,
} from '@/utils/solicitante';
import { aNombrePropio } from '@/utils/texto';

const HORA_MS = 60 * 60 * 1000;

/** Una cita solo se cancela o reprograma mientras siga en curso. */
const ESTADOS_CANCELABLES: EstadoSolicitud[] = ['pendiente', 'aprobada'];

/**
 * Temas que se ofrecen a la comunidad. useTemas() (HU-13) trae también los inactivos, porque
 * sirve a la administración.
 */
export function temasActivos(temas: TemaAsesoria[]): TemaAsesoria[] {
  return temas.filter((tema) => tema.activo);
}

export type DiaFranjas = { fecha: string; franjas: FranjaAsesoria[] };

/** Agrupa las franjas por día, en orden de fecha y hora, sin las que ya no tienen cupo. */
export function agruparFranjasPorDia(franjas: FranjaAsesoria[]): DiaFranjas[] {
  const ordenadas = franjas
    .filter((f) => f.cuposLibres > 0)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio));

  const dias: DiaFranjas[] = [];
  for (const franja of ordenadas) {
    const ultimo = dias[dias.length - 1];
    if (ultimo?.fecha === franja.fecha) ultimo.franjas.push(franja);
    else dias.push({ fecha: franja.fecha, franjas: [franja] });
  }
  return dias;
}

export function textoCupos(cupos: number): string {
  return cupos === 1 ? '1 cupo libre' : `${cupos} cupos libres`;
}

/** Si la cita sigue en curso (pendiente o aprobada), sin mirar el plazo. */
export function citaEnCurso(cita: Pick<Cita, 'estado'>): boolean {
  return ESTADOS_CANCELABLES.includes(cita.estado);
}

/**
 * Si la cita todavía se puede cancelar o reprogramar (HU-14, CA3). La API vuelve a validar.
 *
 * Desde la versión 1.1 (#278) la regla depende del estado, como en el Backend:
 * - **pendiente**: se cancela en cualquier momento, sin plazo;
 * - **aprobada**: hasta `horasCancelacion` horas antes de la cita.
 */
export function puedeCancelarCita(
  cita: Pick<Cita, 'estado' | 'fecha' | 'horaInicio'>,
  horasCancelacion: number,
  ahora: Date = new Date(),
): boolean {
  if (!citaEnCurso(cita)) return false;
  if (cita.estado === 'pendiente') return true;
  return inicioReserva(cita).getTime() - ahora.getTime() >= horasCancelacion * HORA_MS;
}

export function textoPlazoCancelacion(horas: number): string {
  const plazo = horas === 1 ? '1 hora' : `${horas} horas`;
  return `Las citas aprobadas se pueden cancelar o reprogramar hasta ${plazo} antes; las pendientes, en cualquier momento.`;
}

const LARGO_MINIMO_NECESIDAD = 10;
const LARGO_MAXIMO_NECESIDAD = 300;

/** Lo que la persona necesita de la asesoría (HU-14, CA1). */
export const esquemaCita = z.object({
  necesidad: z
    .string()
    .trim()
    .min(LARGO_MINIMO_NECESIDAD, {
      error: `Cuéntanos qué necesitas, con al menos ${LARGO_MINIMO_NECESIDAD} caracteres.`,
    })
    .max(LARGO_MAXIMO_NECESIDAD, { error: `Máximo ${LARGO_MAXIMO_NECESIDAD} caracteres.` }),
});

export type FormularioCita = z.input<typeof esquemaCita>;

// ── Versión 1.1: la asesoría se pide con fecha y hora (#249) ────────────────────────────
// Las reglas son las de `POST advisories/appointments/` del Backend («Cambios del backend para
// frontend», noviembre de 2026, sección 2), y las mismas que valida solicitarCita() en la API.

export const MODALIDADES_ASESORIA: {
  valor: ModalidadAsesoria;
  etiqueta: string;
  icono: string;
}[] = [
  { valor: 'presencial', etiqueta: 'Presencial', icono: 'account-group-outline' },
  { valor: 'virtual', etiqueta: 'Virtual', icono: 'laptop' },
];

const HORA_MS_CITA = 60 * 60 * 1000;

/**
 * ¿Ese día ya no sirve para pedir una asesoría? Para el calendario (CA2): los días pasados, los
 * que no tienen atención (HU-28) y los que caen enteros dentro de la anticipación mínima. Si una
 * parte del día todavía sirve, se puede elegir y la hora dice si cumple.
 */
export function motivoDiaNoElegibleCita(
  fecha: string,
  parametros: Parametros,
  ahora: Date = new Date(),
): string | null {
  if (fecha < hoyISO()) return 'Ya pasó';
  const motivo = motivoNoDisponible(fecha, parametros);
  if (motivo) return `No disponible: ${motivo}`;
  const horario = horariosDeFecha(fecha, parametros).at(-1);
  if (horario) {
    const ultimaHora = aHora(aMinutos(horario.cierra) - parametros.duracionAsesoriaMinutos);
    if (!cumpleAnticipacionCita(fecha, ultimaHora, parametros, ahora)) {
      return `Faltan menos de ${parametros.horasMinimasSolicitud} h`;
    }
  }
  return null;
}

function cumpleAnticipacionCita(
  fecha: string,
  hora: string,
  parametros: Parametros,
  ahora: Date,
): boolean {
  const inicio = new Date(`${fecha}T${hora}:00`).getTime();
  return inicio - ahora.getTime() >= parametros.horasMinimasSolicitud * HORA_MS_CITA;
}

/**
 * La primera hora y la última en que puede empezar una asesoría ese día: la asesoría dura
 * `duracionAsesoriaMinutos` y termina antes del cierre. Null si ese día no hay horario.
 */
export function horasInicioCita(
  fecha: string,
  parametros: Parametros,
): { desde: string; hasta: string } | null {
  const rangos = horariosDeFecha(fecha, parametros)
    .filter(({ abre, cierra }) => aMinutos(cierra) - aMinutos(abre) >= parametros.duracionAsesoriaMinutos);
  const primero = rangos[0];
  const ultimo = rangos.at(-1);
  return primero && ultimo
    ? { desde: primero.abre, hasta: aHora(aMinutos(ultimo.cierra) - parametros.duracionAsesoriaMinutos) }
    : null;
}

/**
 * Por qué la fecha o la hora no sirven, con el campo donde va el error, o null (CA2). La usan el
 * formulario y la reprogramación; la API vuelve a validar.
 */
export function problemaFechaHoraCita(
  fecha: string,
  hora: string,
  parametros: Parametros,
  ahora: Date = new Date(),
): { campo: 'fecha' | 'hora'; mensaje: string } | null {
  if (!esFechaValida(fecha)) return { campo: 'fecha', mensaje: 'Elige la fecha.' };
  if (fecha < hoyISO()) return { campo: 'fecha', mensaje: 'Esa fecha ya pasó.' };
  const motivo = motivoNoDisponible(fecha, parametros);
  if (motivo) return { campo: 'fecha', mensaje: `Ese día no hay atención: ${motivo}.` };
  const horas = horasInicioCita(fecha, parametros);
  if (!horas) return { campo: 'fecha', mensaje: 'Ese día la biblioteca no atiende.' };
  if (!esHoraValida(hora)) return { campo: 'hora', mensaje: 'Elige la hora.' };
  if (!horariosDeFecha(fecha, parametros).some((h) => hora >= h.abre && aMinutos(hora) + parametros.duracionAsesoriaMinutos <= aMinutos(h.cierra))) {
    return {
      campo: 'hora',
      mensaje: `Elige una hora dentro de una franja de atención: la asesoría dura ${parametros.duracionAsesoriaMinutos} minutos.`,
    };
  }
  if (!cumpleAnticipacionCita(fecha, hora, parametros, ahora)) {
    return {
      campo: 'hora',
      mensaje: `Las asesorías se piden con ${parametros.horasMinimasSolicitud} horas de anticipación. Elige una hora más tarde u otro día.`,
    };
  }
  return null;
}

/** Mensaje del grupo que pasa del máximo: el Backend sugiere pedir una capacitación. */
export function mensajeMaximoPersonas(maximo: number): string {
  return `Una asesoría es para ${maximo} personas como máximo. Para un grupo mayor, solicita una capacitación.`;
}

/**
 * La solicitud de asesoría (#249), por pestañas: Solicitud (fecha, hora, modalidad, personas, los
 * nombres de los otros integrantes, la necesidad, la asignatura y las novedades), Tus datos
 * (#224, sin la identificación, que el Backend no pide aquí) y Términos (TERMINOS_FORMACION).
 * Cada campo se valida por su lado para que los errores se vean todos a la vez.
 */
export function esquemaSolicitudCita(parametros: Parametros) {
  return z
    .object({
      ...camposSolicitante,
      // Texto y no z.enum: empieza vacía hasta que la persona elige.
      modalidad: z
        .string()
        .refine((valor) => MODALIDADES_ASESORIA.some((opcion) => opcion.valor === valor), {
          error: 'Elige la modalidad: presencial o virtual.',
        }),
      fecha: z.string(),
      hora: z.string(),
      /** Del CampoNumerico, como texto. */
      personas: z.string(),
      /** Los nombres de los **otros** integrantes: personas − 1, un campo por persona. */
      participantes: z.array(z.string()),
      necesidad: esquemaCita.shape.necesidad,
      asignatura: z
        .string()
        .trim()
        .max(LARGO_MAXIMO_ASIGNATURA, { error: `Máximo ${LARGO_MAXIMO_ASIGNATURA} caracteres.` }),
      novedades: z
        .string()
        .trim()
        .max(LARGO_MAXIMO_NOVEDADES, { error: `Máximo ${LARGO_MAXIMO_NOVEDADES} caracteres.` }),
      terminosAceptados: campoTerminos,
    })
    .superRefine((datos, ctx) => {
      const error = (path: (string | number)[], mensaje: string) =>
        ctx.addIssue({ code: 'custom', path, message: mensaje });

      const fechaHora = problemaFechaHoraCita(datos.fecha, datos.hora, parametros);
      if (fechaHora) error([fechaHora.campo], fechaHora.mensaje);

      const personas = Number(datos.personas);
      const maximo = parametros.maximoPersonasAsesoria;
      if (!/^\d+$/.test(datos.personas) || personas < 1) {
        error(['personas'], 'Indica cuántas personas asisten: al menos una.');
      } else if (personas > maximo) {
        error(['personas'], mensajeMaximoPersonas(maximo));
      } else {
        for (let i = 0; i < personas - 1; i += 1) {
          const nombre = (datos.participantes[i] ?? '').trim();
          if (!nombre) error(['participantes', i], `Escribe el nombre de la persona ${i + 2}.`);
          else if (nombre.length > LARGO_MAXIMO_NOMBRE) {
            error(['participantes', i], `Máximo ${LARGO_MAXIMO_NOMBRE} caracteres.`);
          }
        }
      }

      reglasSolicitante(datos, ctx, { pedirIdentificacion: false, pedirSede: true });
    });
}

export type ValoresSolicitudCita = z.input<ReturnType<typeof esquemaSolicitudCita>>;

/** Qué campos van en cada pestaña, para marcar con `alerta` la que tiene errores. */
export const PESTANA_DE_CAMPO_CITA: Record<keyof ValoresSolicitudCita, PestanaCita> = {
  fecha: 'solicitud',
  hora: 'solicitud',
  modalidad: 'solicitud',
  personas: 'solicitud',
  participantes: 'solicitud',
  necesidad: 'solicitud',
  asignatura: 'solicitud',
  novedades: 'solicitud',
  tipo: 'datos',
  nombreCompleto: 'datos',
  identificacion: 'datos',
  correo: 'datos',
  celular: 'datos',
  sede: 'datos',
  nivel: 'datos',
  facultad: 'datos',
  programa: 'datos',
  semestre: 'datos',
  terminosAceptados: 'terminos',
};

export type PestanaCita = 'solicitud' | 'datos' | 'terminos';

/** Valores iniciales: los datos de quien pide, prellenados con la sesión y el perfil. */
export function valoresInicialesCita(solicitante: ValoresSolicitante): ValoresSolicitudCita {
  return {
    ...VALORES_SOLICITANTE_VACIOS,
    ...solicitante,
    modalidad: '',
    fecha: '',
    hora: '',
    personas: '1',
    participantes: [],
    necesidad: '',
    asignatura: '',
    novedades: '',
    terminosAceptados: false,
  };
}

/** Del formulario a lo que se envía (`NuevaSolicitudCita`): los nombres como nombre propio. */
export function aNuevaSolicitudCita(
  temaId: string,
  valores: ValoresSolicitudCita,
): NuevaSolicitudCita {
  const personas = Number(valores.personas);
  const asignatura = valores.asignatura.trim();
  const novedades = valores.novedades.trim();
  return {
    temaId,
    modalidad: valores.modalidad as ModalidadAsesoria,
    fecha: valores.fecha,
    hora: valores.hora,
    necesidad: valores.necesidad.trim(),
    personas,
    participantes: valores.participantes.slice(0, personas - 1).map(aNombrePropio),
    datosSolicitante: aDatosSolicitante(valores),
    ...(asignatura ? { asignatura } : {}),
    ...(novedades ? { novedades } : {}),
    terminosAceptados: valores.terminosAceptados,
  };
}

/**
 * Reprogramar (#249, CA4): como `reschedule/` del Backend, solo cambian la fecha y la hora; lo
 * demás se copia de la cita anterior. Si la cita es de antes de la versión 1.1 y no trae los
 * datos de quien la pidió, salen de la sesión.
 */
export function solicitudReprogramada(
  cita: Cita,
  fecha: string,
  hora: string,
  usuario: Usuario,
): NuevaSolicitudCita {
  const personas = cita.personas ?? 1;
  return {
    temaId: cita.temaId,
    modalidad: cita.modalidad,
    fecha,
    hora,
    necesidad: cita.necesidad,
    personas,
    participantes: (cita.participantes ?? []).slice(0, personas - 1),
    datosSolicitante: cita.datosSolicitante ?? datosSolicitanteDe(usuario),
    ...(cita.asignatura ? { asignatura: cita.asignatura } : {}),
    ...(cita.novedades ? { novedades: cita.novedades } : {}),
    terminosAceptados: true,
  };
}

/**
 * La fecha y la hora que pidió la persona, solo si el personal las cambió al aprobar (#249,
 * CA3); si no cambiaron, null y basta con mostrar la fecha de la cita.
 */
export function fechaPedidaCita(
  cita: Pick<Cita, 'fecha' | 'horaInicio' | 'fechaSolicitada' | 'horaSolicitada'>,
): { fecha: string; hora: string } | null {
  const fecha = cita.fechaSolicitada ?? cita.fecha;
  const hora = cita.horaSolicitada ?? cita.horaInicio;
  return fecha === cita.fecha && hora === cita.horaInicio ? null : { fecha, hora };
}

/** El enlace de la reunión: solo de una cita virtual ya aprobada que lo tenga (#249, CA3). */
export function enlaceCita(
  cita: Pick<Cita, 'modalidad' | 'estado' | 'enlaceVirtual'>,
): string | null {
  return cita.modalidad === 'virtual' && cita.estado === 'aprobada' && cita.enlaceVirtual
    ? cita.enlaceVirtual
    : null;
}

/** Esquema de la reprogramación: solo la fecha y la hora nuevas (#249). */
export function esquemaReprogramarCita(parametros: Parametros) {
  return z.object({ fecha: z.string(), hora: z.string() }).superRefine((datos, ctx) => {
    const problema = problemaFechaHoraCita(datos.fecha, datos.hora, parametros);
    if (problema)
      ctx.addIssue({ code: 'custom', path: [problema.campo], message: problema.mensaje });
  });
}

export type ValoresReprogramarCita = z.input<ReturnType<typeof esquemaReprogramarCita>>;
