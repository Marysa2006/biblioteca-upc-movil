/**
 * «Términos» de una solicitud (#251; la usa primero la asesoría, #249): el texto de los términos
 * del servicio (TERMINOS_FORMACION o TERMINOS_ESPACIOS), la política de datos (#246) y la casilla
 * «He leído y acepto los términos y condiciones», obligatoria.
 * Sin aceptarla, la solicitud no se envía: el error va bajo la casilla y Android lo anuncia (en
 * iOS lo anuncia el formulario).
 */
import { StyleSheet, View } from 'react-native';
import { Checkbox, HelperText, Text } from 'react-native-paper';

import { EnlacePoliticaDatos } from '@/components/privacidad/EnlacePoliticaDatos';
import { colores, espacio, fuentes } from '@/theme';

type Props = {
  /** El texto de los términos del servicio. */
  texto: string;
  aceptados: boolean;
  onCambiar: (aceptados: boolean) => void;
  mensajeError?: string;
  deshabilitado?: boolean;
};

export function SeccionTerminos({
  texto,
  aceptados,
  onCambiar,
  mensajeError,
  deshabilitado = false,
}: Props) {
  return (
    <View style={estilos.seccion}>
      <Text variant="titleSmall" style={estilos.titulo} accessibilityRole="header">
        Términos y condiciones
      </Text>
      <Text variant="bodyMedium" style={estilos.texto}>
        {texto}
      </Text>
      <EnlacePoliticaDatos nota="Tus datos se tratan según la política de la Universidad:" />
      <Checkbox.Item
        label="He leído y acepto los términos y condiciones"
        status={aceptados ? 'checked' : 'unchecked'}
        onPress={() => onCambiar(!aceptados)}
        disabled={deshabilitado}
        position="leading"
        mode="android"
        color={colores.primario}
        uncheckedColor={colores.bordeFuerte}
        style={estilos.casilla}
        labelStyle={estilos.etiquetaCasilla}
        accessibilityLabel="Acepto los términos y condiciones"
      />
      <View accessibilityLiveRegion="polite">
        <HelperText type="error" visible={mensajeError != null}>
          {mensajeError}
        </HelperText>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  seccion: { gap: espacio.s },
  titulo: { color: colores.primario, fontFamily: fuentes.seminegrita },
  texto: { color: colores.texto },
  // Sin el relleno lateral del ítem, la casilla se alinea con el texto de arriba.
  casilla: { paddingHorizontal: 0 },
  etiquetaCasilla: { color: colores.texto, fontFamily: fuentes.seminegrita, textAlign: 'left' },
});
