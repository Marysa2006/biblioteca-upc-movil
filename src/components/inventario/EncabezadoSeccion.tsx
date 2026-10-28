/**
 * Encabezado de una sección de Inventario: ícono, título y una línea de ayuda, sin tarjeta.
 * Separa los filtros de la sección del selector principal (Tablets · Préstamos · Vencidos).
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';

type Props = {
  /** Ícono de MaterialCommunityIcons junto al título. */
  icono: string;
  titulo: string;
  descripcion: string;
};

export function EncabezadoSeccion({ icono, titulo, descripcion }: Props) {
  return (
    <View style={estilos.encabezado}>
      <Icon source={icono} size={24} color={colores.primario} />
      <View style={estilos.textos}>
        <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
          {titulo}
        </Text>
        <Text variant="bodySmall" style={estilos.descripcion}>
          {descripcion}
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.s, marginTop: espacio.s },
  textos: { flex: 1, gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  descripcion: { color: colores.textoSecundario },
});
