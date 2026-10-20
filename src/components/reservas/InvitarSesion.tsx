/**
 * Invitación a iniciar sesión para solicitar un espacio (HU-18): reservar pide cuenta
 * institucional. Con ?volver=1, el login regresa a esta pantalla con la fecha y la hora intactas.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { colores, espacio, radio } from '@/theme';

export function InvitarSesion({ nombreEspacio }: { nombreEspacio: string }) {
  return (
    <View style={estilos.tarjeta}>
      <Icon source="account-lock-outline" size={32} color={colores.primario} />
      <Text variant="bodyLarge" style={estilos.texto}>
        {`Inicia sesión con tu cuenta institucional para solicitar ${nombreEspacio}.`}
      </Text>
      <Button
        mode="contained"
        onPress={() => router.push({ pathname: '/login', params: { volver: '1' } })}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Iniciar sesión para solicitar la reserva"
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
