/**
 * Las condiciones de uso del préstamo de tablets con la casilla para aceptarlas (HU-22, CA3).
 * Sin aceptarlas, la solicitud no se envía: el error va debajo de la casilla y se anuncia
 * (Android con accessibilityLiveRegion; en iOS lo anuncia el formulario).
 * Revisión de la 1.1: el texto abre en una ventana («Leer las condiciones», con Acepto), para que
 * no alargue la pantalla; la casilla queda a la vista.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Checkbox, HelperText, Text } from 'react-native-paper';

import { DialogoTexto } from '@/components/ui';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { CondicionesTablet } from '@/types';
import { fechaLegible } from '@/utils/fechas';

type Props = {
  condiciones: CondicionesTablet;
  aceptadas: boolean;
  onCambiar: (aceptadas: boolean) => void;
  mensajeError?: string;
  deshabilitado?: boolean;
};

export function CondicionesUso({ condiciones, aceptadas, onCambiar, mensajeError, deshabilitado }: Props) {
  const [ver, setVer] = useState(false);
  return (
    <View style={estilos.tarjeta}>
      <Text variant="titleSmall" style={estilos.titulo} accessibilityRole="header">
        {condiciones.titulo}
      </Text>
      <Button
        mode="text"
        icon="file-document-outline"
        onPress={() => setVer(true)}
        style={estilos.leer}
        compact
        accessibilityRole="button"
        accessibilityLabel="Leer las condiciones de uso del préstamo de tablets"
      >
        Leer las condiciones
      </Button>
      <DialogoTexto
        visible={ver}
        titulo={condiciones.titulo}
        onCerrar={() => setVer(false)}
        aceptar={deshabilitado ? undefined : { texto: 'Acepto', onPress: () => onCambiar(true) }}
      >
        {condiciones.texto.split('\n').map((linea) => (
          <Text key={linea} variant="bodyMedium" style={estilos.texto}>
            {`• ${linea}`}
          </Text>
        ))}
        <Text variant="bodySmall" style={estilos.secundario}>
          {`Actualizadas el ${fechaLegible(condiciones.actualizada)}.`}
        </Text>
      </DialogoTexto>

      <Checkbox.Item
        label="Leí y acepto las condiciones de uso"
        status={aceptadas ? 'checked' : 'unchecked'}
        onPress={() => onCambiar(!aceptadas)}
        disabled={deshabilitado}
        position="leading"
        mode="android"
        color={colores.primario}
        uncheckedColor={colores.bordeFuerte}
        style={estilos.casilla}
        labelStyle={estilos.etiquetaCasilla}
        accessibilityLabel="Acepto las condiciones de uso del préstamo de tablets"
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
  secundario: { color: colores.textoSecundario },
  // Sin el relleno lateral del ítem, la casilla se alinea con el texto de arriba.
  casilla: { paddingHorizontal: 0 },
  etiquetaCasilla: { color: colores.texto, fontFamily: fuentes.seminegrita, textAlign: 'left' },
});
