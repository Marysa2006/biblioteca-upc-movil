/**
 * Sección Indicadores de Estadísticas (HU-26): el total de operaciones y los gráficos por
 * servicio, tipo de usuario, programa y mes, con filtros (CA1); la exportación a CSV de lo
 * que se está viendo (CA2) y el aviso cuando los filtros no dejan resultados (CA3).
 *
 * Las opciones de los chips salen de los registros del periodo (solo desde y hasta), así cada
 * chip dice cuántas operaciones tiene. Los indicadores y el CSV usan todos los filtros.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { FiltrosIndicadores } from '@/components/estadisticas/FiltrosIndicadores';
import { BarraDistribucion } from '@/components/estadisticas/BarraDistribucion';
import { ColumnasMes } from '@/components/estadisticas/ColumnasMes';
import { GraficoBarras } from '@/components/estadisticas/GraficoBarras';
import { TarjetaIndicador } from '@/components/estadisticas/TarjetaIndicador';
import { AvisoError, EstadoCarga, EstadoError, EstadoVacio } from '@/components/ui';
import { useExportarEstadisticas, useIndicadores, useRegistrosUso } from '@/hooks/useEstadisticas';
import { acentoServicio, colores, espacio, fuentes, radio } from '@/theme';
import {
  NO_INFORMADO,
  type CategoriaServicio,
  type FiltrosEstadisticas,
  type IndicadoresUso,
  type ServicioEstadistica,
} from '@/types';
import { NOMBRE_TIPO_USUARIO } from '@/utils/estadisticas';
import {
  conMayuscula,
  hayFiltros,
  LIMITE_PROGRAMAS,
  operacionesSinPrograma,
  opcionesFiltros,
  servicioDeEtiqueta,
  textoOperaciones,
  textoPeriodo,
  textoPorcentaje,
  variacionUltimoMes,
} from '@/utils/filtrosEstadisticas';

export function SeccionIndicadores() {
  const [filtros, setFiltros] = useState<FiltrosEstadisticas>({});
  const [aviso, setAviso] = useState<string | null>(null);

  const periodo = useRegistrosUso({ desde: filtros.desde, hasta: filtros.hasta });
  const indicadores = useIndicadores(filtros);
  const registros = useRegistrosUso(filtros);
  const exportar = useExportarEstadisticas();

  // En Android lo lee accessibilityLiveRegion; en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  const cambiarFiltros = (nuevos: FiltrosEstadisticas) => {
    setFiltros(nuevos);
    setAviso(null);
    exportar.reset();
  };

  const alExportar = () => {
    const lista = registros.data;
    if (!lista) return;
    setAviso(null);
    exportar.mutate(lista, {
      onSuccess: ({ archivo, compartido }) =>
        setAviso(
          compartido
            ? `Se exportó ${textoOperaciones(lista.length)} en ${archivo}.`
            : `El celular no permite compartir: el archivo ${archivo} quedó guardado en la app.`,
        ),
    });
  };

  const opciones = opcionesFiltros(periodo.data ?? [], filtros);
  const reintentar = () => {
    indicadores.refetch();
    registros.refetch();
    periodo.refetch();
  };

  let contenido;
  if (indicadores.isPending) {
    contenido = <EstadoCarga mensaje="Calculando los indicadores…" />;
  } else if (indicadores.isError) {
    contenido = (
      <EstadoError mensaje="No pudimos cargar los indicadores." onReintentar={reintentar} />
    );
  } else if (indicadores.data.total === 0) {
    contenido = hayFiltros(filtros) ? (
      <View style={estilos.vacio}>
        <EstadoVacio mensaje="No hay resultados con estos filtros. Prueba con otro periodo u otros valores." />
        <Button
          mode="contained-tonal"
          icon="filter-remove-outline"
          onPress={() => cambiarFiltros({})}
          style={estilos.botonVacio}
          accessibilityLabel="Quitar todos los filtros"
        >
          Quitar filtros
        </Button>
      </View>
    ) : (
      <EstadoVacio mensaje="Todavía no hay operaciones registradas. Cada reserva, asesoría, préstamo o capacitación aparecerá en los indicadores." />
    );
  } else {
    contenido = (
      <>
        <Resumen
          indicadores={indicadores.data}
          periodo={textoPeriodo(filtros.desde, filtros.hasta)}
          onExportar={alExportar}
          exportando={exportar.isPending}
          puedeExportar={Boolean(registros.data)}
        />
        {exportar.error ? (
          <AvisoError mensaje="No pudimos exportar el archivo. Inténtalo de nuevo." />
        ) : null}
        {aviso ? (
          <Text variant="bodyMedium" style={estilos.aviso} accessibilityLiveRegion="polite">
            {aviso}
          </Text>
        ) : null}
        <Tarjetas indicadores={indicadores.data} />
        <Graficos indicadores={indicadores.data} />
      </>
    );
  }

  return (
    <View style={estilos.seccion}>
      <FiltrosIndicadores filtros={filtros} onCambiar={cambiarFiltros} opciones={opciones} />
      {contenido}
    </View>
  );
}

/** Bloque oscuro del total con el botón de exportar, como en el mockup. */
function Resumen({
  indicadores,
  periodo,
  onExportar,
  exportando,
  puedeExportar,
}: {
  indicadores: IndicadoresUso;
  periodo: string | null;
  onExportar: () => void;
  exportando: boolean;
  puedeExportar: boolean;
}) {
  const subtitulo = periodo ? `operaciones · ${periodo.toLowerCase()}` : 'operaciones registradas';
  return (
    <View style={estilos.resumen}>
      <View
        accessible
        accessibilityLabel={`${textoOperaciones(indicadores.total)}${periodo ? `, ${periodo.toLowerCase()}` : ''}`}
      >
        <Text variant="displaySmall" style={estilos.total}>
          {indicadores.total}
        </Text>
        <Text variant="bodyMedium" style={estilos.textoResumen}>
          {subtitulo}
        </Text>
      </View>
      <Button
        mode="contained"
        icon="download"
        onPress={onExportar}
        loading={exportando}
        disabled={exportando || !puedeExportar}
        buttonColor={colores.superficie}
        textColor={colores.primarioOscuro}
        style={estilos.exportar}
        accessibilityLabel={`Exportar ${textoOperaciones(indicadores.total)} a CSV`}
      >
        Exportar CSV
      </Button>
    </View>
  );
}

/**
 * Los cuatro indicadores principales en una cuadrícula de 2×2, como el tablero del equipo de
 * Análisis: el servicio más usado, las operaciones sin programa (calidad de los datos), quiénes
 * usan más los servicios y cómo va el último mes frente al anterior.
 */
function Tarjetas({ indicadores }: { indicadores: IndicadoresUso }) {
  const { total } = indicadores;
  const servicio = indicadores.porServicio[0];
  const usuarios = indicadores.porTipoUsuario[0];
  const ultimoMes = indicadores.porMes.at(-1);
  const variacion = variacionUltimoMes(indicadores.porMes);
  const sinPrograma = operacionesSinPrograma(indicadores);

  return (
    <View style={estilos.cuadricula}>
      {servicio ? (
        <TarjetaIndicador
          icono="star-outline"
          titulo="Servicio más usado"
          valor={servicio.etiqueta}
          detalle={`${textoOperaciones(servicio.cantidad)} · ${textoPorcentaje(servicio.cantidad, total)}`}
        />
      ) : null}
      <TarjetaIndicador
        icono="account-question-outline"
        titulo="Sin programa registrado"
        valor={textoPorcentaje(sinPrograma, total)}
        detalle={`${sinPrograma} de ${textoOperaciones(total)}`}
      />
      {usuarios ? (
        <TarjetaIndicador
          icono="account-group-outline"
          titulo="Usuarios más frecuentes"
          valor={usuarios.etiqueta}
          detalle={`${textoPorcentaje(usuarios.cantidad, total)} de las operaciones`}
        />
      ) : null}
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

/** Un gráfico de cada tipo, como el tablero: distribución, columnas y ranking. */
function Graficos({ indicadores }: { indicadores: IndicadoresUso }) {
  const { total } = indicadores;
  const noInformado = NOMBRE_TIPO_USUARIO[NO_INFORMADO];

  const servicios = indicadores.porServicio.map((grupo) => {
    const servicio = servicioDeEtiqueta(grupo.etiqueta);
    return {
      ...grupo,
      color: servicio ? acentoServicio[CATEGORIA_DE_SERVICIO[servicio]] : colores.bordeFuerte,
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

  return (
    <>
      <BarraDistribucion
        titulo="Demanda por servicio"
        descripcion="Qué parte de las operaciones fue de cada servicio"
        datos={servicios}
        total={total}
      />
      <ColumnasMes
        titulo="Operaciones por mes"
        descripcion="Cuántas operaciones hubo cada mes"
        datos={indicadores.porMes}
      />
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
    </>
  );
}

/**
 * Color de cada servicio de las estadísticas: el de su categoría (HU-01). Guías y catálogo no
 * son categorías propias: usan los de repositorio y préstamo, que son los más cercanos.
 */
const CATEGORIA_DE_SERVICIO: Record<ServicioEstadistica, CategoriaServicio> = {
  espacios: 'espacios',
  asesorias: 'asesorias',
  tablets: 'tablets',
  capacitaciones: 'capacitaciones',
  guias: 'repositorio',
  catalogo: 'prestamo',
};

const estilos = StyleSheet.create({
  seccion: { gap: espacio.m },
  vacio: { gap: espacio.m },
  botonVacio: { alignSelf: 'center' },
  resumen: {
    gap: espacio.m,
    padding: espacio.l,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioOscuro,
  },
  total: { color: colores.superficie, fontFamily: fuentes.negrita },
  textoResumen: { color: colores.superficie },
  exportar: { alignSelf: 'flex-start', borderRadius: radio.boton },
  aviso: { color: colores.texto },
  cuadricula: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
});
