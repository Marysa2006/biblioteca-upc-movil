import type { ConteoIndicador, FiltrosEstadisticas, IndicadoresUso } from '@/types';
import { NOMBRE_SERVICIO } from '@/utils/estadisticas';
import { normalizarTexto } from '@/utils/texto';

type Serie = { labels: string[]; values: (number | null)[] };
export type ResumenBackend = {
  total: number;
  unique_users: number;
  attendees: number;
  average_rating: number | null;
  attendees_by_service?: Serie;
  by_service: Serie;
  by_month: Serie;
  by_department: Serie;
  by_campus: Serie;
  by_topic: Serie;
  by_weekday: Serie;
  by_semester: Serie;
  by_user_type: Serie;
  by_program: Serie;
  by_status: Serie;
  by_modality: Serie;
  response_hours: Serie;
  by_service_month?: Record<string, Serie>;
  tablet_loans: {
    returned: number;
    average_hours: number | null;
    standard_hours: number;
    up_to_standard: number;
    under_one_hour: number;
  };
};

const CODIGOS = {
  espacios: 'SPACE_RESERVATION',
  asesorias: 'ADVISORY',
  capacitaciones: 'TRAINING',
  tablets: 'TABLET_LOAN',
} as const;

export function servicioEstadistico(etiqueta: string): keyof typeof CODIGOS | undefined {
  const valor = normalizarTexto(etiqueta);
  if (valor.includes('espacio') || valor === 'space_reservation') return 'espacios';
  if (valor.includes('asesor') || valor === 'advisory') return 'asesorias';
  if (valor.includes('capacit') || valor === 'training') return 'capacitaciones';
  if (valor.includes('tablet')) return 'tablets';
}

export function consultaEstadisticas(filtros: FiltrosEstadisticas, formato?: 'csv' | 'pdf' | 'xlsx') {
  const { desde, hasta, facultad, sede, servicio, programa } = filtros;
  const codigo =
    servicio && servicio in CODIGOS ? CODIGOS[servicio as keyof typeof CODIGOS] : undefined;
  const parametros = {
    from: desde,
    to: hasta,
    department: facultad,
    campus: sede,
    service: codigo,
    program: programa,
    format: formato,
  };
  const query = Object.entries(parametros)
    .filter(([, valor]) => valor && valor !== 'todos')
    .map(
      ([clave, valor]) =>
        `${clave}=${encodeURIComponent(valor === 'no_informado' ? 'No informado' : valor!)}`,
    )
    .join('&');
  return query ? `?${query}` : '';
}

function conteos(serie?: Serie): ConteoIndicador[] {
  return (
    serie?.labels.flatMap((etiqueta, i) =>
      serie.values[i] == null ? [] : [{ etiqueta, cantidad: serie.values[i]! }],
    ) ?? []
  );
}

export function indicadoresDesdeBackend(resumen: ResumenBackend): IndicadoresUso {
  const periodos = conteos(resumen.by_semester).sort((a, b) =>
    a.etiqueta.localeCompare(b.etiqueta),
  );
  const porServicio = conteos(resumen.by_service).map(({ etiqueta, cantidad }) => {
    const servicio = servicioEstadistico(etiqueta);
    return { etiqueta: servicio ? NOMBRE_SERVICIO[servicio] : etiqueta, cantidad };
  });
  const tablets = resumen.tablet_loans;
  const mesesTablet = Object.entries(resumen.by_service_month ?? {}).find(
    ([etiqueta]) => servicioEstadistico(etiqueta) === 'tablets',
  )?.[1];
  return {
    total: resumen.total,
    usuariosUnicos: resumen.unique_users,
    asistentes: resumen.attendees,
    asistentesPorServicio: conteos(resumen.attendees_by_service).map(({ etiqueta, cantidad }) => {
      const servicio = servicioEstadistico(etiqueta);
      return { etiqueta: servicio ? NOMBRE_SERVICIO[servicio] : etiqueta, cantidad };
    }),
    porServicio,
    porTipoUsuario: conteos(resumen.by_user_type),
    porPrograma: conteos(resumen.by_program),
    porMes: conteos(resumen.by_month),
    porFacultad: conteos(resumen.by_department),
    porSede: conteos(resumen.by_campus),
    porPeriodo: periodos,
    porSemestre: periodos,
    porDiaSemana: conteos(resumen.by_weekday),
    porTematica: conteos(resumen.by_topic),
    calificacionPromedio: resumen.average_rating ?? undefined,
    porEstado: conteos(resumen.by_status),
    porModalidad: conteos(resumen.by_modality),
    porTemaAsesoria: [],
    porLineaFormacion: [],
    tiempoRespuesta: conteos(resumen.response_hours).flatMap(({ etiqueta, cantidad }) => {
      const servicio = servicioEstadistico(etiqueta);
      return servicio
        ? [{ servicio, etiqueta: NOMBRE_SERVICIO[servicio], horasPromedio: cantidad }]
        : [];
    }),
    tablets: {
      prestamos:
        porServicio.find((fila) => fila.etiqueta === NOMBRE_SERVICIO.tablets)?.cantidad ?? 0,
      conDuracion: tablets.returned,
      duracionPromedio: tablets.average_hours ?? undefined,
      horasReferencia: tablets.standard_hours,
      dentroDeReferencia: tablets.up_to_standard,
      menosDeUnaHora: tablets.under_one_hour,
      porMes: conteos(mesesTablet),
      porPrograma: [],
    },
  };
}
