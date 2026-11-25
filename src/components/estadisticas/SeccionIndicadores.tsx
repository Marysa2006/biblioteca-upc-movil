/**
 * Indicadores de Estadísticas (HU-26, CA1 y CA3): el contenido de las pestañas Resumen,
 * Servicios, Tablets y Calidad, con los filtros que guarda la pantalla.
 * - Versión 1.1 (#260): facultad, sede y periodo, y la calificación promedio.
 * - #307 (tabla 2.7 de la bibliotecóloga y el tablero de Análisis de datos): por estado,
 *   presencial y virtual, tiempo de respuesta, temas de asesoría y líneas de formación, la
 *   pestaña Tablets (duración y cumplimiento de la duración de los parámetros), los hallazgos
 *   clave y las operaciones en el tiempo por mes o por semestre.
 * Los filtros y la exportación van en BarraEstadisticas, encima de todas las pestañas; el total
 * es una tarjeta del Resumen.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { BarraDistribucion } from '@/components/estadisticas/BarraDistribucion';
import { ColumnasMes } from '@/components/estadisticas/ColumnasMes';
import { GraficoBarras } from '@/components/estadisticas/GraficoBarras';
import { GraficoTiempoRespuesta } from '@/components/estadisticas/GraficoTiempoRespuesta';
import { TarjetaIndicador } from '@/components/estadisticas/TarjetaIndicador';
import { EstadoCarga, EstadoError, EstadoVacio, PestanasFiltro } from '@/components/ui';
import { usaApi } from '@/api/cliente';
import { useIndicadores } from '@/hooks/useEstadisticas';
import { acentoServicio, colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import {
  NO_INFORMADO,
  type FiltrosEstadisticas,
  type IndicadoresUso,
  type ServicioEstadistica,
} from '@/types';
import { indicadoresDeFinalizacion, NOMBRE_ESTADO_USO, NOMBRE_MODALIDAD_USO, NOMBRE_TIPO_USUARIO } from '@/utils/estadisticas';
import {
  conMayuscula,
  hallazgosClave,
  hayFiltros,
  LIMITE_PROGRAMAS,
  nombrePeriodo,
  operacionesSinPrograma,
  periodosEnOrden,
  servicioDeEtiqueta,
  textoCalificacion,
  textoHoras,
  textoOperaciones,
  textoPeriodo,
  textoPorcentaje,
  variacionUltimoMes,
} from '@/utils/filtrosEstadisticas';

/** Las pestañas con indicadores; Registros va aparte, en SeccionRegistros. */
export type PestanaIndicadores = 'resumen' | 'servicios' | 'tablets' | 'calidad';

type Props = {
  filtros: FiltrosEstadisticas;
  pestana: PestanaIndicadores;
  onQuitarFiltros: () => void;
};

export function SeccionIndicadores({ filtros, pestana, onQuitarFiltros }: Props) {
  const indicadores = useIndicadores(filtros);

  if (indicadores.isPending) return <EstadoCarga mensaje="Calculando los indicadores…" />;
  if (indicadores.isError) {
    return (
      <EstadoError
        mensaje="No pudimos cargar los indicadores."
        onReintentar={() => indicadores.refetch()}
      />
    );
  }
  if (indicadores.data.total === 0) {
    return hayFiltros(filtros) ? (
      <View style={estilos.vacio}>
        <EstadoVacio
          pose="buscando"
          mensaje="No hay resultados con estos filtros. Prueba con otro periodo u otros valores."
        />
        <Button
          mode="contained-tonal"
          icon="filter-remove-outline"
          onPress={onQuitarFiltros}
          style={estilos.botonVacio}
          accessibilityLabel="Quitar todos los filtros"
        >
          Quitar filtros
        </Button>
      </View>
    ) : (
      <EstadoVacio mensaje="Todavía no hay operaciones registradas. Cada reserva, asesoría, préstamo o capacitación aparecerá en los indicadores." />
    );
  }

  const datos = indicadores.data;
  return (
    <View style={estilos.seccion}>
      {pestana === 'resumen' ? (
        <PestanaResumen indicadores={datos} periodo={textoPeriodo(filtros.desde, filtros.hasta)} />
      ) : null}
      {pestana === 'servicios' ? <PestanaServicios indicadores={datos} /> : null}
      {pestana === 'tablets' ? <PestanaTablets indicadores={datos} /> : null}
      {pestana === 'calidad' ? <PestanaCalidad indicadores={datos} /> : null}
    </View>
  );
}

/** Cómo se agrupan las operaciones en el tiempo (#307). */
type Agrupacion = 'mes' | 'semestre';

/**
 * Resumen: lo principal en tarjetas (el total, el servicio más usado, quiénes usan más y el último
 * mes frente al anterior), los hallazgos clave y las operaciones en el tiempo.
 */
function PestanaResumen({
  indicadores,
  periodo,
}: {
  indicadores: IndicadoresUso;
  /** El periodo de los filtros en palabras, o null sin fechas. */
  periodo: string | null;
}) {
  const { total } = indicadores;
  const servicio = indicadores.porServicio[0];
  const usuarios = usaApi('estadisticas') ? undefined : indicadores.porTipoUsuario[0];
  const cierre = indicadoresDeFinalizacion(indicadores);
  const ultimoMes = indicadores.porMes.at(-1);
  const variacion = variacionUltimoMes(indicadores.porMes);
  // La bibliotecóloga lo quiere por mes, con la opción de agrupar por semestre (tabla 2.7).
  const [agrupacion, setAgrupacion] = useState<Agrupacion>('mes');
  const hallazgos = hallazgosClave(indicadores);

  return (
    <>
      <View style={estilos.cuadricula}>
        {indicadores.usuariosUnicos != null ? <TarjetaIndicador
          icono="account-group-outline" titulo="Usuarios únicos" valor={String(indicadores.usuariosUnicos)} detalle="Personas distintas"
        /> : null}
        {indicadores.asistentes != null ? <TarjetaIndicador
          icono="account-check-outline" titulo="Asistencias registradas" valor={String(indicadores.asistentes)} detalle="Con QR y a mano"
        /> : null}
        <TarjetaIndicador
          icono="chart-box-outline"
          titulo="Operaciones"
          valor={String(total)}
          detalle={periodo ?? 'Todas las registradas'}
        />
        {servicio ? (
          <TarjetaIndicador
            icono="star-outline"
            titulo="Servicio más usado"
            valor={servicio.etiqueta}
            detalle={`${textoOperaciones(servicio.cantidad)} · ${textoPorcentaje(servicio.cantidad, total)}`}
          />
        ) : null}
        {usuarios ? (
          <TarjetaIndicador
            icono="account-group-outline"
            titulo="Usuarios más frecuentes"
            valor={usuarios.etiqueta}
            detalle={`${textoPorcentaje(usuarios.cantidad, total)} de las operaciones`}
          />
        ) : null}
        <TarjetaIndicador icono="check-circle-outline" titulo="Tasa de finalización"
          valor={String(cierre.tasaFinalizacion) + ' %'} detalle={String(cierre.finalizadas) + ' finalizadas'} />
        <TarjetaIndicador icono="close-circle-outline" titulo="Cancelaciones y rechazos"
          valor={String(cierre.tasaCancelacionesYRechazos) + ' %'} detalle={String(cierre.noPrestadas) + ' solicitudes sin prestar'} />
        {ultimoMes ? (
          <TarjetaIndicador
            icono="calendar-month-outline"
            titulo={conMayuscula(ultimoMes.etiqueta)}
            valor={String(ultimoMes.cantidad)}
            detalle={variacion.texto}
            sentido={variacion.sentido}
          />
        ) : null}
      </View>

      {indicadores.asistentesPorServicio?.length ? (
        <GraficoBarras titulo="Asistentes por servicio" datos={indicadores.asistentesPorServicio}
          total={indicadores.asistentes ?? 0} sustantivo="asistentes" />
      ) : null}
      {hallazgos.length > 0 ? <HallazgosClave frases={hallazgos} /> : null}

      <ColumnasMes
        titulo="Operaciones en el tiempo"
        descripcion={
          agrupacion === 'mes'
            ? 'Cuántas operaciones hubo cada mes'
            : 'Cuántas hubo cada periodo: 1, de enero a junio; 2, de julio a diciembre'
        }
        selector={
          <PestanasFiltro
            opciones={[
              { valor: 'mes', etiqueta: 'Por mes' },
              { valor: 'semestre', etiqueta: 'Por semestre' },
            ]}
            valor={agrupacion}
            onCambiar={setAgrupacion}
            descripcion="Agrupar las operaciones por mes o por semestre"
          />
        }
        {...(agrupacion === 'mes'
          ? { datos: indicadores.porMes }
          : {
              datos: periodosEnOrden(indicadores.porPeriodo),
              etiquetaCorta: (etiqueta: string) => etiqueta,
              nombreAccesible: nombrePeriodo,
              nombrePico: 'el periodo con más operaciones',
            })}
      />
    </>
  );
}

/** Hallazgos clave (#307): frases cortas con su cifra, como en el tablero de Análisis. */
function HallazgosClave({ frases }: { frases: string[] }) {
  return (
    <View style={estilos.tarjeta}>
      <Text variant="titleMedium" style={estilos.tituloTarjeta} accessibilityRole="header">
        Hallazgos clave
      </Text>
      {frases.map((frase) => (
        <View key={frase} style={estilos.hallazgo}>
          <View style={estilos.marcaHallazgo} />
          <Text variant="bodyMedium" style={estilos.textoHallazgo}>
            {frase}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Tonos del tema para los tipos de usuario; "No informado" siempre va en gris. */
const COLORES_TIPO = [
  colores.primarioOscuro,
  colores.verdeUpc,
  acentoServicio.asesorias,
  colores.verdeClaroUpc,
  acentoServicio.capacitaciones,
];

/** Color de cada estado de la operación, el mismo de las solicitudes (`coloresEstado`). */
const COLOR_ESTADO: Record<string, string> = {
  [NOMBRE_ESTADO_USO.completada]: coloresEstado.aprobada.texto,
  [NOMBRE_ESTADO_USO.pendiente]: coloresEstado.pendiente.texto,
  [NOMBRE_ESTADO_USO.cancelada]: coloresEstado.cancelada.texto,
};

/** Presencial y virtual; lo no informado, en gris. */
const COLOR_MODALIDAD: Record<string, string> = {
  [NOMBRE_MODALIDAD_USO.presencial]: colores.primarioOscuro,
  [NOMBRE_MODALIDAD_USO.virtual]: acentoServicio.asesorias,
};

const sumar = (datos: { cantidad: number }[]) => datos.reduce((suma, d) => suma + d.cantidad, 0);

/**
 * Servicios: qué se usa, cómo terminó, en qué modalidad, de qué temas, y quién lo usa (programa,
 * tipo de usuario, facultad y sede).
 */
function PestanaServicios({ indicadores }: { indicadores: IndicadoresUso }) {
  const { total } = indicadores;
  const noInformado = NOMBRE_TIPO_USUARIO[NO_INFORMADO];

  const servicios = indicadores.porServicio.map((grupo) => {
    const servicio = servicioDeEtiqueta(grupo.etiqueta);
    return {
      ...grupo,
      color: servicio ? COLOR_SERVICIO[servicio] : colores.bordeFuerte,
    };
  });
  let siguiente = 0;
  const tipos = indicadores.porTipoUsuario.map((grupo) => ({
    ...grupo,
    color:
      grupo.etiqueta === noInformado
        ? colores.bordeFuerte
        : COLORES_TIPO[siguiente++ % COLORES_TIPO.length],
  }));
  const estados = indicadores.porEstado.map((grupo) => ({
    ...grupo,
    color: COLOR_ESTADO[grupo.etiqueta] ?? colores.bordeFuerte,
  }));
  const modalidades = indicadores.porModalidad.map((grupo) => ({
    ...grupo,
    color: COLOR_MODALIDAD[grupo.etiqueta] ?? colores.bordeFuerte,
  }));

  return (
    <>
      <BarraDistribucion
        titulo="Demanda por servicio"
        descripcion="Qué parte de las operaciones fue de cada servicio"
        datos={servicios}
        total={total}
      />
      <BarraDistribucion
        titulo="Por estado"
        descripcion="Cómo terminaron las solicitudes y operaciones"
        datos={estados}
        total={total}
      />
      <BarraDistribucion
        titulo="Presencial y virtual"
        descripcion="Modalidad de la operación"
        datos={modalidades}
        total={total}
      />
      {indicadores.porTematica?.length ? <GraficoBarras titulo="Por temática"
        descripcion="Temas de asesoría y líneas de formación"
        datos={indicadores.porTematica} total={sumar(indicadores.porTematica)} /> : null}
      {indicadores.porTemaAsesoria.length > 0 ? (
        <GraficoBarras
          titulo="Temas de asesoría"
          descripcion="Asesorías por tema"
          datos={indicadores.porTemaAsesoria}
          total={sumar(indicadores.porTemaAsesoria)}
        />
      ) : null}
      {indicadores.porLineaFormacion.length > 0 ? (
        <GraficoBarras
          titulo="Líneas de formación"
          descripcion="Capacitaciones por línea"
          datos={indicadores.porLineaFormacion}
          total={sumar(indicadores.porLineaFormacion)}
        />
      ) : null}
      <GraficoBarras
        titulo="Programas con más operaciones"
        descripcion="Programa académico de quien hizo la operación"
        datos={indicadores.porPrograma}
        total={total}
        limite={LIMITE_PROGRAMAS}
        numerado
        textoResto={(cantidad) =>
          cantidad === 1 ? 'Y 1 programa más' : `Y ${cantidad} programas más`
        }
      />
      <BarraDistribucion
        titulo="Por tipo de usuario"
        descripcion="Quiénes usaron los servicios"
        datos={tipos}
        total={total}
      />
      <GraficoBarras
        titulo="Por facultad"
        descripcion="Facultad de quien hizo la operación"
        datos={indicadores.porFacultad}
        total={total}
      />
      <GraficoBarras
        titulo="Por sede"
        descripcion="Sede de quien hizo la operación"
        datos={indicadores.porSede}
        total={total}
      />
    </>
  );
}

/**
 * Tablets (#307), como la pestaña del tablero de Análisis: los préstamos, su duración promedio,
 * cuántos duraron la referencia de los parámetros o menos, cuántos se devolvieron sin las dos
 * horas, y los préstamos por mes y por programa.
 */
function PestanaTablets({ indicadores }: { indicadores: IndicadoresUso }) {
  const { tablets } = indicadores;
  if (tablets.prestamos === 0) {
    return <EstadoVacio mensaje="No hay préstamos de tablets con estos filtros." />;
  }
  return (
    <>
      <View style={estilos.cuadricula}>
        <TarjetaIndicador
          icono="tablet"
          titulo="Préstamos"
          valor={String(tablets.prestamos)}
          detalle={`${textoPorcentaje(tablets.prestamos, indicadores.total)} de las operaciones`}
        />
        <TarjetaIndicador
          icono="timer-outline"
          titulo="Duración promedio"
          valor={
            tablets.duracionPromedio == null ? 'Sin datos' : textoHoras(tablets.duracionPromedio)
          }
          detalle={`De ${tablets.conDuracion} con entrega y devolución`}
        />
        <TarjetaIndicador
          icono="check-circle-outline"
          titulo={`Cumplen ${tablets.horasReferencia} h`}
          valor={
            tablets.conDuracion === 0
              ? 'Sin datos'
              : textoPorcentaje(tablets.dentroDeReferencia, tablets.conDuracion)
          }
          detalle={`${tablets.dentroDeReferencia} de ${tablets.conDuracion} duraron ${tablets.horasReferencia} h o menos`}
        />
        {tablets.sinHoraCompleta != null ? <TarjetaIndicador
          icono="clock-alert-outline"
          titulo="Sin hora completa"
          valor={String(tablets.sinHoraCompleta)}
          detalle="Devueltos sin hora de entrega o de devolución"
        /> : null}
        {tablets.menosDeUnaHora != null ? <TarjetaIndicador
          icono="clock-fast" titulo="Menos de una hora" valor={String(tablets.menosDeUnaHora)} detalle="Préstamos devueltos"
        /> : null}
      </View>
      <ColumnasMes
        titulo="Préstamos por mes"
        descripcion="Cuántas tablets se prestaron cada mes"
        datos={tablets.porMes}
      />
      <GraficoBarras
        titulo="Préstamos por programa"
        descripcion="Programa académico de quien pidió la tablet"
        datos={tablets.porPrograma}
        total={tablets.prestamos}
        limite={LIMITE_PROGRAMAS}
        textoResto={(cantidad) =>
          cantidad === 1 ? 'Y 1 programa más' : `Y ${cantidad} programas más`
        }
      />
    </>
  );
}

/**
 * Calidad (#307): la «calidad en tiempos» que pidió la bibliotecóloga (el tiempo de respuesta y
 * la calificación) y la calidad de los datos (las operaciones sin programa registrado), como
 * «Calidad y cobertura» del tablero de Análisis.
 */
function PestanaCalidad({ indicadores }: { indicadores: IndicadoresUso }) {
  const { total } = indicadores;
  const sinPrograma = operacionesSinPrograma(indicadores);
  return (
    <>
      <View style={estilos.cuadricula}>
        {indicadores.calificacionPromedio != null ? (
          <TarjetaIndicador
            icono="star-half-full"
            titulo="Calificación promedio"
            valor={textoCalificacion(indicadores.calificacionPromedio)}
            detalle="De las asesorías y capacitaciones calificadas"
          />
        ) : null}
        <TarjetaIndicador
          icono="account-question-outline"
          titulo="Sin programa registrado"
          valor={textoPorcentaje(sinPrograma, total)}
          detalle={`${sinPrograma} de ${textoOperaciones(total)}`}
        />
      </View>
      {indicadores.tiempoRespuesta.length > 0 ? (
        <GraficoTiempoRespuesta datos={indicadores.tiempoRespuesta} />
      ) : (
        <EstadoVacio mensaje="Todavía no hay solicitudes respondidas con estos filtros para medir el tiempo de respuesta." />
      )}
    </>
  );
}

/**
 * Color de cada servicio de las estadísticas: el de su categoría (HU-01). Catálogo no es una
 * categoría propia: usa el de préstamo, el más cercano. Guías tampoco, y el de repositorio es casi
 * igual al verde de espacios (que suelen quedar juntos en la barra): va en el verde oscuro de la
 * marca para distinguirlos (#307).
 */
const COLOR_SERVICIO: Record<ServicioEstadistica, string> = {
  espacios: acentoServicio.espacios,
  asesorias: acentoServicio.asesorias,
  tablets: acentoServicio.tablets,
  capacitaciones: acentoServicio.capacitaciones,
  guias: colores.primarioOscuro,
  catalogo: acentoServicio.prestamo,
};

const estilos = StyleSheet.create({
  seccion: { gap: espacio.m },
  vacio: { gap: espacio.m },
  botonVacio: { alignSelf: 'center' },
  cuadricula: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  tarjeta: {
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  tituloTarjeta: { color: colores.texto, fontFamily: fuentes.negrita },
  hallazgo: { flexDirection: 'row', gap: espacio.s },
  marcaHallazgo: {
    width: espacio.xs,
    borderRadius: radio.boton,
    backgroundColor: colores.primario,
  },
  textoHallazgo: { flex: 1, color: colores.texto },
});
