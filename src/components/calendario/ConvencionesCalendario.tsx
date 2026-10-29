/**
 * Las convenciones de Mi calendario (HU-30): qué significa cada ícono de la tira y del mes.
 * Cada tipo va con su ícono, su color y su nombre. No se presionan.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { acentoServicio, colores, espacio, fuentes } from '@/theme';
import {
  CATEGORIA_COMPROMISO,
  ICONO_COMPROMISO,
  NOMBRE_COMPROMISO,
  TIPOS_COMPROMISO,
} from '@/utils/miCalendario';

export function ConvencionesCalendario() {
  return (
    <View style={estilos.convenciones}>
      <Text variant="labelMedium" style={estilos.titulo}>
        CONVENCIONES
      </Text>
      <View style={estilos.fila}>
        {TIPOS_COMPROMISO.map((tipo) => (
          <View key={tipo} style={estilos.item}>
            <Icon source={ICONO_COMPROMISO[tipo]} size={16} color={acentoServicio[CATEGORIA_COMPROMISO[tipo]]} />
            <Text variant="bodySmall" style={estilos.texto}>
              {NOMBRE_COMPROMISO[tipo]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  convenciones: { gap: espacio.xs },
  titulo: { color: colores.textoSecundario, fontFamily: fuentes.seminegrita },
  fila: { flexDirection: 'row', flexWrap: 'wrap', columnGap: espacio.m, rowGap: espacio.xs },
  item: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  texto: { color: colores.texto },
});
