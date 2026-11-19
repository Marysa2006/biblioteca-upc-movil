/**
 * Las tres notas del formato de responsabilidad con la casilla para aceptarla (#163, CA3).
 * Sin aceptarla, la solicitud no se envía: el error va debajo de la casilla y se anuncia
 * (Android con accessibilityLiveRegion; en iOS lo anuncia el formulario). La tablet todavía no
 * está asignada, así que la tercera nota va sin el valor del bien (notasDelPrestamo).
 */
import { StyleSheet, View } from 'react-native';
import { Checkbox, HelperText, Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import { notasDelPrestamo } from '@/utils/prestamos';

type Props = {
  aceptada: boolean;
  onCambiar: (aceptada: boolean) => void;
  mensajeError?: string;
  deshabilitado?: boolean;
};

export function ResponsabilidadPrestamo({
  aceptada,
  onCambiar,
  mensajeError,
  deshabilitado,
}: Props) {
  return (
    <View style={estilos.tarjeta}>
      <Text variant="titleSmall" style={estilos.titulo} accessibilityRole="header">
        Responsabilidad sobre el préstamo
      </Text>
      <View style={estilos.puntos}>
        {notasDelPrestamo(undefined).map((nota) => (
          <Text key={nota} variant="bodyMedium" style={estilos.texto}>
            {`• ${nota}`}
          </Text>
        ))}
      </View>

      <Checkbox.Item
        label="Acepto la responsabilidad sobre el préstamo"
        status={aceptada ? 'checked' : 'unchecked'}
        onPress={() => onCambiar(!aceptada)}
        disabled={deshabilitado}
        position="leading"
        mode="android"
        color={colores.primario}
        uncheckedColor={colores.bordeFuerte}
        style={estilos.casilla}
        labelStyle={estilos.etiquetaCasilla}
        accessibilityLabel="Acepto la responsabilidad sobre el préstamo de la tablet"
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
  tarjeta: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  titulo: { color: colores.primario, fontFamily: fuentes.seminegrita },
  puntos: { gap: espacio.xs },
  texto: { color: colores.texto },
  // Sin el relleno lateral del ítem, la casilla se alinea con el texto de arriba.
  casilla: { paddingHorizontal: 0 },
  etiquetaCasilla: { color: colores.texto, fontFamily: fuentes.seminegrita, textAlign: 'left' },
});
