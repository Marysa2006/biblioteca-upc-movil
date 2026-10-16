/** Aviso para quien entra a una función del personal sin el permiso correspondiente (HU-07). */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { colores, espacio } from '@/theme';

export function SinPermiso() {
  return (
    <View style={estilos.contenedor}>
      <Icon source="lock-outline" size={40} color={colores.textoSecundario} />
      <Text variant="bodyMedium" style={estilos.texto}>
        Esta sección es para la administración de la biblioteca.
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { alignItems: 'center', gap: espacio.s, paddingVertical: espacio.xl },
  texto: { color: colores.textoSecundario, textAlign: 'center' },
});
