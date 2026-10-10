/**
 * Los tres estados que toda pantalla con datos debe contemplar: cargando, error y vacío.
 */
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Icon, Text } from 'react-native-paper';

import { colores, espacio } from '@/theme';

export function EstadoCarga({ mensaje = 'Cargando…' }: { mensaje?: string }) {
  return (
    <View style={estilos.contenedor}>
      <ActivityIndicator color={colores.primario} />
      <Text variant="bodyMedium" style={estilos.texto}>
        {mensaje}
      </Text>
    </View>
  );
}

type PropsError = {
  mensaje?: string;
  onReintentar?: () => void;
};

export function EstadoError({
  mensaje = 'No pudimos cargar la información.',
  onReintentar,
}: PropsError) {
  return (
    <View style={estilos.contenedor}>
      <Icon source="alert-circle-outline" size={40} color={colores.error} />
      <Text variant="bodyMedium" style={estilos.texto}>
        {mensaje}
      </Text>
      {onReintentar ? (
        <Button mode="outlined" onPress={onReintentar}>
          Reintentar
        </Button>
      ) : null}
    </View>
  );
}

export function EstadoVacio({ mensaje = 'No hay nada para mostrar todavía.' }: { mensaje?: string }) {
  return (
    <View style={estilos.contenedor}>
      <Icon source="inbox-outline" size={40} color={colores.textoSecundario} />
      <Text variant="bodyMedium" style={estilos.texto}>
        {mensaje}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.s,
    paddingVertical: espacio.xl,
  },
  texto: { color: colores.textoSecundario, textAlign: 'center' },
});
