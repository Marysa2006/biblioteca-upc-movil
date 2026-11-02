/**
 * Resultados de una búsqueda del Catálogo, en Koha (HU-02) o en el repositorio (HU-11).
 * Solo muestra: los datos y las acciones llegan por props desde la pantalla, que usa
 * useBusquedaCatalogo() o useBusquedaRepositorio(). Tiene sus estados de carga, error con
 * reintentar y vacío; los textos cambian con la fuente.
 */
import { useEffect } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { AvisoError, EstadoCarga, EstadoError, EstadoVacio } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes } from '@/theme';
import { type ResultadoBusqueda, textoResultados } from '@/utils/busqueda';

import { TarjetaResultado } from './TarjetaResultado';

/** Los textos que cambian entre Koha y el repositorio. */
export type TextosFuente = {
  /** Con artículo, para las frases: "el catálogo", "el repositorio". */
  nombre: string;
  /** Debajo del total, por ejemplo "Toca un resultado para ver sus ejemplares…". */
  nota: string;
  /** Lo que hace tocar un resultado, para el lector: "Abre la ficha en el catálogo". */
  accion: string;
  /** Botón que abre la misma búsqueda en el navegador: "Filtrar en Koha". */
  filtrar: string;
};

type Props = {
  textos: TextosFuente;
  /** Texto buscado, tal como se envió. */
  texto: string;
  resultados: ResultadoBusqueda[];
  total: number;
  cargando: boolean;
  error: boolean;
  onReintentar: () => void;
  /** Hay más páginas. */
  hayMas: boolean;
  cargandoMas: boolean;
  /** Falló la carga de la página siguiente (las ya cargadas se siguen viendo). */
  errorMas: boolean;
  onVerMas: () => void;
  onAbrir: (resultado: ResultadoBusqueda) => void;
  /** Abre la misma búsqueda en el navegador, con sus filtros. */
  onFiltrar: () => void;
};

export function ResultadosBusqueda({
  textos,
  texto,
  resultados,
  total,
  cargando,
  error,
  onReintentar,
  hayMas,
  cargandoMas,
  errorMas,
  onVerMas,
  onAbrir,
  onFiltrar,
}: Props) {
  const buscado = texto.trim();
  const resumen = textoResultados(total, buscado);
  const listo = !cargando && !error;

  // En Android lo anuncia accessibilityLiveRegion; en iOS, aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && listo) {
      AccessibilityInfo.announceForAccessibility(resumen);
    }
  }, [listo, resumen]);

  if (cargando) {
    return <EstadoCarga mensaje={`Buscando en ${textos.nombre}…`} />;
  }
  if (error) {
    return (
      <EstadoError
        mensaje={`No pudimos buscar en ${textos.nombre}. Revisa tu conexión.`}
        onReintentar={onReintentar}
      />
    );
  }

  const botonFiltrar = (
    <Button
      mode="text"
      icon="open-in-new"
      onPress={onFiltrar}
      contentStyle={estilos.contenidoBoton}
      accessibilityRole="link"
      accessibilityLabel={`${textos.filtrar}: abre la búsqueda de «${buscado}» en el navegador`}
    >
      {textos.filtrar}
    </Button>
  );

  if (resultados.length === 0) {
    return (
      <View style={estilos.contenedor}>
        <EstadoVacio
          mensaje={`No encontramos «${buscado}» en ${textos.nombre}. Prueba con otras palabras o con el apellido del autor.`}
        />
        {botonFiltrar}
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.encabezado}>
        <Text
          variant="titleMedium"
          style={estilos.resumen}
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
        >
          {resumen}
        </Text>
        <Text variant="bodySmall" style={estilos.nota}>
          {textos.nota}
        </Text>
      </View>

      <View style={estilos.lista}>
        {resultados.map((resultado) => (
          <TarjetaResultado
            key={resultado.id}
            resultado={resultado}
            accion={textos.accion}
            onPress={() => onAbrir(resultado)}
          />
        ))}
      </View>

      {errorMas ? (
        <AvisoError mensaje="No pudimos cargar más resultados.">
          <Button
            mode="outlined"
            icon="refresh"
            onPress={onVerMas}
            textColor={coloresEstado.rechazada.texto}
            style={estilos.botonReintentar}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Reintentar cargar más resultados"
          >
            Reintentar
          </Button>
        </AvisoError>
      ) : hayMas ? (
        <Button
          mode="outlined"
          onPress={onVerMas}
          loading={cargandoMas}
          disabled={cargandoMas}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Ver más resultados. Se muestran ${resultados.length} de ${total}`}
        >
          Ver más resultados
        </Button>
      ) : null}

      {botonFiltrar}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.m },
  encabezado: { gap: espacio.xs },
  resumen: { color: colores.texto, fontFamily: fuentes.negrita },
  nota: { color: colores.textoSecundario },
  lista: { gap: espacio.s },
  botonReintentar: { borderColor: coloresEstado.rechazada.texto },
  contenidoBoton: { paddingVertical: espacio.xs },
});
