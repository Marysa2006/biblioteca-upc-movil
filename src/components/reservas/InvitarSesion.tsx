/**
 * Invitación a iniciar sesión para solicitar un servicio: reservar un espacio (HU-18) o agendar
 * una asesoría (HU-14) pide cuenta institucional. Con ?volver=1, el login regresa a la pantalla
 * de origen con lo que la persona había elegido intacto.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { colores, espacio, radio } from '@/theme';

type Props = {
  /** Por ejemplo: "Inicia sesión con tu cuenta institucional para solicitar Virtualteca." */
  mensaje: string;
  /** Etiqueta del botón para el lector de pantalla. */
  etiqueta: string;
};

export function InvitarSesion({ mensaje, etiqueta }: Props) {
  return (
    <View style={estilos.tarjeta}>
      <Icon source="account-lock-outline" size={32} color={colores.primario} />
      <Text variant="bodyLarge" style={estilos.texto}>
        {mensaje}
      </Text>
      <Button
        mode="contained"
        onPress={() => router.push({ pathname: '/login', params: { volver: '1' } })}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
      >
        Iniciar sesión
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    alignItems: 'center',
    gap: espacio.m,
    padding: espacio.l,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  texto: { color: colores.texto, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
