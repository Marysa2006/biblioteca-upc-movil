/**
 * Fila con texto e interruptor (Switch). Toda la fila se puede presionar: el Switch solo
 * es pequeño para tocarlo, y el lector de pantalla anuncia la fila como un interruptor.
 */
import { StyleSheet, View } from 'react-native';
import { Switch, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';

type Props = {
  etiqueta: string;
  /** Explica qué pasa al activarlo. */
  ayuda?: string;
  valor: boolean;
  onCambiar: (valor: boolean) => void;
  deshabilitado?: boolean;
};

export function FilaInterruptor({ etiqueta, ayuda, valor, onCambiar, deshabilitado = false }: Props) {
  return (
    <TouchableRipple
      onPress={() => onCambiar(!valor)}
      disabled={deshabilitado}
      style={estilos.fila}
      accessibilityRole="switch"
      accessibilityState={{ checked: valor, disabled: deshabilitado }}
      accessibilityLabel={ayuda ? `${etiqueta}. ${ayuda}` : etiqueta}
    >
      <View style={estilos.contenido}>
        <View style={estilos.textos}>
          <Text variant="bodyLarge" style={estilos.etiqueta}>
            {etiqueta}
          </Text>
          {ayuda ? (
            <Text variant="bodySmall" style={estilos.ayuda}>
              {ayuda}
            </Text>
          ) : null}
        </View>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Switch value={valor} onValueChange={onCambiar} disabled={deshabilitado} />
        </View>
      </View>
    </TouchableRipple>
  );
}

const estilos = StyleSheet.create({
  fila: { borderRadius: radio.boton },
  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    paddingVertical: espacio.s,
  },
  textos: { flex: 1, gap: espacio.xs },
  etiqueta: { color: colores.texto, fontFamily: fuentes.seminegrita },
  ayuda: { color: colores.textoSecundario },
});
