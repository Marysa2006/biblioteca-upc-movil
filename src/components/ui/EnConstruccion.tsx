import { StyleSheet, View } from 'react-native';
import { Card, Icon, Text } from 'react-native-paper';

import { colores, espacio } from '@/theme';

type Props = {
  /** Historias de usuario que construyen esta pantalla, por ejemplo "HU-02". */
  hu: string;
  descripcion: string;
};

/** Marcador para pantallas que todavía no se construyen. Se borra cuando la HU se implementa. */
export function EnConstruccion({ hu, descripcion }: Props) {
  return (
    <Card mode="outlined" style={estilos.tarjeta}>
      <Card.Content style={estilos.contenido}>
        <Icon source="hammer-wrench" size={32} color={colores.primario} />
        <View style={estilos.textos}>
          <Text variant="titleMedium">En construcción · {hu}</Text>
          <Text variant="bodyMedium" style={estilos.descripcion}>
            {descripcion}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: colores.superficie },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espacio.m },
  textos: { flex: 1, gap: espacio.xs },
  descripcion: { color: colores.textoSecundario },
});
