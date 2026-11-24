/**
 * Las tres notas del formato de responsabilidad con la casilla para aceptarla (#163, CA3).
 * Sin aceptarla, la solicitud no se envía: el error va debajo de la casilla y se anuncia
 * (Android con accessibilityLiveRegion; en iOS lo anuncia el formulario). La tablet todavía no
 * está asignada, así que la tercera nota va sin el valor del bien (notasDelPrestamo).
 * Revisión de la 1.1: las notas abren en una ventana («Leer las notas», con Acepto).
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Checkbox, HelperText, Text } from 'react-native-paper';

import { DialogoTexto } from '@/components/ui';

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
  const [ver, setVer] = useState(false);
  return (
    <View style={estilos.tarjeta}>
      <Text variant="titleSmall" style={estilos.titulo} accessibilityRole="header">
        Responsabilidad sobre el préstamo
      </Text>
      <Button
        mode="text"
        icon="file-document-outline"
        onPress={() => setVer(true)}
        style={estilos.leer}
        compact
        accessibilityRole="button"
        accessibilityLabel="Leer las notas de responsabilidad sobre el préstamo"
      >
        Leer las notas
      </Button>
      <DialogoTexto
        visible={ver}
        titulo="Responsabilidad sobre el préstamo"
        onCerrar={() => setVer(false)}
        aceptar={deshabilitado ? undefined : { texto: 'Acepto', onPress: () => onCambiar(true) }}
      >
        {notasDelPrestamo(undefined).map((nota) => (
          <Text key={nota} variant="bodyMedium" style={estilos.texto}>
            {`• ${nota}`}
          </Text>
        ))}
      </DialogoTexto>

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
  leer: { alignSelf: 'flex-start' },
  texto: { color: colores.texto },
  // Sin el relleno lateral del ítem, la casilla se alinea con el texto de arriba.
  casilla: { paddingHorizontal: 0 },
  etiquetaCasilla: { color: colores.texto, fontFamily: fuentes.seminegrita, textAlign: 'left' },
});
