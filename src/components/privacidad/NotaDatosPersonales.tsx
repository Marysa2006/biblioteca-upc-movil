/**
 * Nota de privacidad para los formularios que piden datos personales que no vienen de la cuenta
 * institucional (#225, CA3): dice para qué se usan y enlaza la política de la UPC.
 * El texto de la política es de la Universidad; aquí solo se explica el uso en la app.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colores, espacio, radio } from '@/theme';

import { EnlacePoliticaDatos } from './EnlacePoliticaDatos';

type Props = {
  /** Para qué se usan los datos de este formulario, en una frase. */
  mensaje: string;
  /** Muestra el enlace a la política. */
  conEnlace?: boolean;
};

export function NotaDatosPersonales({ mensaje, conEnlace = true }: Props) {
  return (
    <View style={estilos.tarjeta}>
      <Text variant="bodySmall" style={estilos.texto}>
        {mensaje}
      </Text>
      {conEnlace ? <EnlacePoliticaDatos /> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.xs,
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.superficieVariante,
  },
  texto: { color: colores.texto },
});
