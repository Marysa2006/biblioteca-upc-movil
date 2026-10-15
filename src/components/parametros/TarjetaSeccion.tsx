/** Tarjeta de una sección del formulario de parámetros (HU-28): ícono, título y ayuda. */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';

type Props = {
  icono: string;
  titulo: string;
  ayuda?: string;
  children: ReactNode;
};

export function TarjetaSeccion({ icono, titulo, ayuda, children }: Props) {
  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <Icon source={icono} size={24} color={colores.primario} />
        <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
          {titulo}
        </Text>
      </View>
      {ayuda ? (
        <Text variant="bodySmall" style={estilos.ayuda}>
          {ayuda}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  titulo: { flex: 1, color: colores.texto, fontFamily: fuentes.negrita },
  ayuda: { color: colores.textoSecundario },
});
