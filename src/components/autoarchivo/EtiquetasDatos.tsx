/**
 * Metadatos del autoarchivo como etiquetas (HU-11, CA1): nombres cortos que bajan de línea solos.
 * Son View + Text y no Chip de Paper, porque el Chip corta el texto a una sola línea y con
 * letra grande se perdería. No se tocan: el lector de pantalla las lee como una lista.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colores, espacio, radio } from '@/theme';
import { textoEtiqueta } from '@/utils/autoarchivo';

export function EtiquetasDatos({ datos }: { datos: string[] }) {
  const etiquetas = datos.map(textoEtiqueta);

  return (
    <View
      style={estilos.contenedor}
      accessible
      accessibilityLabel={`Datos que te pedirán: ${etiquetas.join(', ')}.`}
    >
      {etiquetas.map((texto, indice) => (
        <View key={indice} style={estilos.etiqueta}>
          <Text variant="bodyMedium" style={estilos.texto}>
            {texto}
          </Text>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  etiqueta: {
    paddingVertical: espacio.xs,
    paddingHorizontal: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioSuave,
  },
  texto: { color: colores.primarioOscuro },
});
