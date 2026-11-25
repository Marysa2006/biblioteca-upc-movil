/**
 * Aviso para quien tiene sesión pero, por su tipo de usuario, no puede pedir un servicio (#240):
 * los estudiantes y egresados no reservan espacios, y los egresados no piden tablets. En lugar
 * del formulario, explica por qué y lleva a los demás servicios.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import type { TipoUsuario } from '@/types';
import { colores, espacio, radio } from '@/theme';
import { NOMBRE_TIPO } from '@/utils/roles';

type Props = {
  /** Quién puede pedir el servicio, por ejemplo MENSAJE_NO_RESERVA_ESPACIOS. */
  mensaje: string;
  /** El tipo de quien tiene la sesión, para decirle con qué cuenta entró. */
  tipo: TipoUsuario;
};

export function ServicioNoPermitido({ mensaje, tipo }: Props) {
  return (
    <View style={estilos.tarjeta} accessibilityLiveRegion="polite">
      <Icon source="account-cancel-outline" size={32} color={colores.textoSecundario} />
      <Text variant="bodyLarge" style={estilos.texto}>
        {mensaje}
      </Text>
      <Text variant="bodyMedium" style={estilos.detalle}>
        {`Entraste con una cuenta de tipo ${NOMBRE_TIPO[tipo].toLowerCase()}.`}
      </Text>
      <Button
        mode="outlined"
        onPress={() => router.navigate('/servicios')}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Ver los demás servicios de la biblioteca"
      >
        Ver otros servicios
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
  detalle: { color: colores.textoSecundario, textAlign: 'center' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
