/**
 * Parámetros generales (HU-28).
 * Consulta y actualiza periodos académicos, festivos, horarios y plazos.
 *
 * Con la API (módulo `parametros` de `usaApi()`), se leen de `config/` del Backend
 * (src/api/backend/parametros.ts). Todos los calendarios de la app dependen de esto: los días
 * hábiles salen de los horarios y los festivos (`esDiaHabil()`).
 * Los cambios se guardan por recurso en `config/`.
 */
import { useSesion } from '@/store/sesion';
import type { HorarioAtencion, Parametros } from '@/types';
import { tienePermiso } from '@/utils/roles';

import {
  festivoDesdeBackend,
  festivoHaciaBackend,
  horarioHaciaBackend,
  horariosDesdeBackend,
  periodoDesdeBackend,
  periodoHaciaBackend,
  plazosDesdeBackend,
  plazosHaciaBackend,
  type FestivoBackend,
  type HorarioBackend,
  type ParametroBackend,
  type PeriodoBackend,
} from './backend/parametros';
import { horaDesdeBackend } from './backend/equivalencias';
import { ErrorApi, peticion, peticionTodas, simularRed, usaApi } from './cliente';
import { PARAMETROS } from './mocks/parametros';

function clonar(valor: Parametros): Parametros {
  return JSON.parse(JSON.stringify(valor)) as Parametros;
}

/** Copia mutable: con mocks, los cambios se ven durante la sesión de la app. */
let parametros: Parametros = clonar(PARAMETROS);

/**
 * Validación de consistencia de la HU-28 (CA2): fechas cruzadas, horarios
 * incoherentes y plazos negativos. Devuelve el mensaje de error o null si está bien.
 */
export function validarParametros(valor: Parametros): string | null {
  for (const periodo of valor.periodos) {
    if (!periodo.nombre?.trim()) {
      return 'Cada periodo necesita un nombre.';
    }
    if (periodo.inicio > periodo.fin) {
      return `El periodo "${periodo.nombre}" tiene las fechas cruzadas.`;
    }
  }
  for (const [indice, horario] of valor.horarios.entries()) {
    if (horario.abre >= horario.cierra) {
      return 'Hay un horario que cierra antes de abrir.';
    }
    if (valor.horarios.slice(indice + 1).some((otro) =>
      horario.dia === otro.dia && horario.abre < otro.cierra && otro.abre < horario.cierra,
    )) {
      return 'Hay horarios de atención que se cruzan en el mismo día.';
    }
  }
  if (valor.horasMinimasSolicitud < 0 || valor.horasMinimasCancelacion < 0) {
    return 'Los tiempos mínimos no pueden ser negativos.';
  }
  return null;
}

/**
 * Los plazos del Backend, solo para quien los administra: los demás reciben 403 (o 401 sin
 * sesión) y la app usa los valores de siempre.
 */
async function leerPlazos(): Promise<ParametroBackend[]> {
  if (!tienePermiso(useSesion.getState().usuario, 'parametros')) return [];
  try {
    return await peticionTodas<ParametroBackend, ParametroBackend>(
      '/config/parameters/',
      (parametro) => parametro,
    );
  } catch (error) {
    if (error instanceof ErrorApi && (error.estado === 401 || error.estado === 403)) return [];
    throw error;
  }
}

const RUTA_PERIODOS = '/config/periods/';
const RUTA_FESTIVOS = '/config/holidays/';
const RUTA_HORARIOS = '/config/schedules/';
const RUTA_PLAZOS = '/config/parameters/';

async function leerConfiguracion() {
  const [periodos, festivos, horarios, plazos] = await Promise.all([
    peticionTodas<PeriodoBackend, PeriodoBackend>(RUTA_PERIODOS, (periodo) => periodo),
    peticionTodas<FestivoBackend, FestivoBackend>(RUTA_FESTIVOS, (festivo) => festivo),
    peticion<HorarioBackend[]>(RUTA_HORARIOS),
    leerPlazos(),
  ]);
  return { periodos, festivos, horarios, plazos };
}

function parametrosDesdeConfiguracion({ periodos, festivos, horarios, plazos }: Awaited<ReturnType<typeof leerConfiguracion>>) {
  // Los textos de las comunicaciones no están en el Backend (son sus plantillas de correo).
  return plazosDesdeBackend(plazos, {
    ...clonar(PARAMETROS),
    periodos: periodos.map(periodoDesdeBackend),
    festivos: festivos.map(festivoDesdeBackend),
    horarios: horariosDesdeBackend(horarios),
  });
}

export async function obtenerParametros(): Promise<Parametros> {
  if (!usaApi('parametros')) return simularRed(clonar(parametros));
  return parametrosDesdeConfiguracion(await leerConfiguracion());
}

function cambiarRegistro(ruta: string, metodo: 'POST' | 'PATCH' | 'DELETE', cuerpo?: object) {
  return peticion(ruta, { method: metodo, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
}

async function guardarPeriodos(valor: Parametros['periodos'], actuales: PeriodoBackend[]) {
  const porId = new Map(actuales.map((periodo) => [String(periodo.id), periodo]));
  const conservar = new Set(valor.map((periodo) => periodo.id));
  for (const actual of actuales) {
    if (!conservar.has(String(actual.id))) await cambiarRegistro(`${RUTA_PERIODOS}${actual.id}/`, 'DELETE');
  }
  for (const periodo of valor) {
    const anterior = porId.get(periodo.id);
    const datos = periodoHaciaBackend(periodo);
    if (!anterior) {
      await cambiarRegistro(RUTA_PERIODOS, 'POST', { ...datos, is_active: true });
    } else if (anterior.name !== datos.name || anterior.start_date !== datos.start_date || anterior.end_date !== datos.end_date) {
      await cambiarRegistro(`${RUTA_PERIODOS}${anterior.id}/`, 'PATCH', datos);
    }
  }
}

async function guardarFestivos(valor: Parametros['festivos'], actuales: FestivoBackend[]) {
  const porFecha = new Map(actuales.map((festivo) => [festivo.date, festivo]));
  const conservar = new Set(valor.map((festivo) => festivo.fecha));
  for (const actual of actuales) {
    if (!conservar.has(actual.date)) await cambiarRegistro(`${RUTA_FESTIVOS}${actual.id}/`, 'DELETE');
  }
  for (const festivo of valor) {
    const anterior = porFecha.get(festivo.fecha);
    if (!anterior) await cambiarRegistro(RUTA_FESTIVOS, 'POST', festivoHaciaBackend(festivo));
    else if (anterior.name !== festivo.motivo) {
      await cambiarRegistro(`${RUTA_FESTIVOS}${anterior.id}/`, 'PATCH', festivoHaciaBackend(festivo));
    }
  }
}

async function guardarHorarios(valor: HorarioAtencion[], actuales: HorarioBackend[]) {
  const horarios = valor.map(horarioHaciaBackend);
  const clave = (horario: Pick<HorarioBackend, 'day_of_week' | 'opening_time' | 'closing_time'>) =>
    `${horario.day_of_week}:${horaDesdeBackend(horario.opening_time)}-${horaDesdeBackend(horario.closing_time)}`;
  const activos = actuales.filter((horario) => horario.is_active !== false);
  const existentes = new Set(activos.map(clave));
  const deseados = new Set(horarios.map(clave));
  const quitar = activos.filter((h) => !deseados.has(clave(h)));
  const crear = horarios.filter((h) => !existentes.has(clave(h)));
  for (const dia of new Set([...quitar, ...crear].map((h) => h.day_of_week))) {
    const anteriores = quitar.filter((h) => h.day_of_week === dia);
    const nuevos = crear.filter((h) => h.day_of_week === dia);
    if (anteriores.length === 1 && nuevos.length === 1) {
      await cambiarRegistro(`${RUTA_HORARIOS}${anteriores[0].id}/`, 'PATCH', nuevos[0]);
      continue;
    }
    for (const anterior of anteriores) await cambiarRegistro(`${RUTA_HORARIOS}${anterior.id}/`, 'DELETE');
    for (const nuevo of nuevos) await cambiarRegistro(RUTA_HORARIOS, 'POST', { ...nuevo, is_active: true });
  }
}

export async function actualizarParametros(valor: Parametros): Promise<Parametros> {
  const error = validarParametros(valor);
  if (error) throw new ErrorApi(400, error);
  if (!usaApi('parametros')) {
    parametros = clonar(valor);
    return simularRed(clonar(parametros));
  }
  if (!tienePermiso(useSesion.getState().usuario, 'parametros')) {
    throw new ErrorApi(403, 'No tienes permiso para guardar los parámetros.');
  }
  const configuracion = await leerConfiguracion();
  const actual = parametrosDesdeConfiguracion(configuracion);
  const plazos = plazosHaciaBackend(valor, actual);
  const publicados = new Map(configuracion.plazos.map((plazo) => [plazo.code, plazo]));
  for (const plazo of plazos) {
    const anterior = publicados.get(plazo.code);
    if (!anterior) throw new ErrorApi(400, `El Backend aún no tiene configurado el parámetro ${plazo.code}.`);
    if (anterior.data_type === 'INTEGER' && !Number.isInteger(plazo.value)) {
      throw new ErrorApi(400, plazo.code === 'min-notice-days'
        ? 'La anticipación para solicitar debe ser un múltiplo de 24 horas.'
        : `El parámetro ${plazo.code} debe ser un número entero.`);
    }
  }
  await guardarPeriodos(valor.periodos, configuracion.periodos);
  await guardarFestivos(valor.festivos, configuracion.festivos);
  await guardarHorarios(valor.horarios, configuracion.horarios);
  for (const { code, value } of plazos) {
    await cambiarRegistro(`${RUTA_PLAZOS}${encodeURIComponent(code)}/`, 'PATCH', { value: String(value) });
  }
  return obtenerParametros();
}
