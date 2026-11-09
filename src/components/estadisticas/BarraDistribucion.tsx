/**
 * Distribución de un indicador en una sola barra dividida (HU-26, CA1): cada grupo ocupa la
 * parte que le toca del total, con su color, y debajo va la leyenda con el número y el
 * porcentaje de cada uno. Hace el papel de la dona del mockup sin paquete de gráficos; el color
 * siempre va con el nombre en texto.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import { textoOperaciones, textoPorcentaje } from '@/utils/filtrosEstadisticas';

export type GrupoDistribucion = {
  etiqueta: string;
  cantidad: number;
  color: string;
};

type Props = {
  titulo: string;
  descripcion?: string;
  datos: GrupoDistribucion[];
  total: number;
};

export function BarraDistribucion({ titulo, descripcion, datos, total }: Props) {
  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
          {titulo}
        </Text>
        {descripcion ? (
          <Text variant="bodySmall" style={estilos.descripcion}>
            {descripcion}
          </Text>
        ) : null}
      </View>

      {/* La barra es decorativa: la leyenda de abajo dice lo mismo en texto. */}
      <View
        style={estilos.barra}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {datos.map((grupo) => (
          <View
            key={grupo.etiqueta}
            style={[estilos.segmento, { flexGrow: grupo.cantidad, backgroundColor: grupo.color }]}
          />
        ))}
      </View>

      <View style={estilos.leyenda}>
        {datos.map((grupo) => {
          const porcentaje = textoPorcentaje(grupo.cantidad, total);
          return (
            <View
              key={grupo.etiqueta}
              style={estilos.fila}
              accessible
              accessibilityLabel={`${grupo.etiqueta}: ${textoOperaciones(grupo.cantidad)}, ${porcentaje} del total`}
            >
              <View style={[estilos.punto, { backgroundColor: grupo.color }]} />
              <Text variant="bodyMedium" style={estilos.etiqueta}>
                {grupo.etiqueta}
              </Text>
              <Text variant="bodyMedium" style={estilos.cantidad}>
                {`${grupo.cantidad} · ${porcentaje}`}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  encabezado: { gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  descripcion: { color: colores.textoSecundario },
  barra: {
    flexDirection: 'row',
    gap: espacio.xs,
    height: espacio.l,
    borderRadius: radio.boton,
    overflow: 'hidden',
  },
  segmento: { flexBasis: 0 },
  leyenda: { gap: espacio.s },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  punto: { width: espacio.m, height: espacio.m, borderRadius: espacio.s },
  etiqueta: { flex: 1, color: colores.texto },
  cantidad: { color: colores.texto, fontFamily: fuentes.seminegrita },
});
