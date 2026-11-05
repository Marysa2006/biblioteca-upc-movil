/**
 * Encabezado de una sección de Inventario: ícono, título y una línea de ayuda, sin tarjeta.
 * Separa los filtros de la sección del selector principal (Tablets · Préstamos · Vencidos).
 * Puede llevar una acción con ícono a la derecha, por ejemplo escanear en Préstamos (HU-31).
 */
import { StyleSheet, View } from 'react-native';
import { Icon, IconButton, Text } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';

type Props = {
  /** Ícono de MaterialCommunityIcons junto al título. */
  icono: string;
  titulo: string;
  descripcion: string;
  /** Acción opcional a la derecha del título. */
  accion?: { icono: string; etiqueta: string; onPress: () => void };
};

export function EncabezadoSeccion({ icono, titulo, descripcion, accion }: Props) {
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
      {accion ? (
        <IconButton
          icon={accion.icono}
          mode="contained-tonal"
          size={24}
          onPress={accion.onPress}
          style={estilos.accion}
          // Mide 40 px: con hitSlop el área táctil llega a 48.
          hitSlop={espacio.xs}
          accessibilityRole="button"
          accessibilityLabel={accion.etiqueta}
        />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.s, marginTop: espacio.s },
  textos: { flex: 1, gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  descripcion: { color: colores.textoSecundario },
  accion: { margin: 0 },
});
