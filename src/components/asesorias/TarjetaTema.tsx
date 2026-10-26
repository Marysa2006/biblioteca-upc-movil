/**
 * Tarjeta de un tema de asesoría (HU-14): nombre y descripción. Con onElegir, toda la tarjeta
 * se presiona y lleva a las franjas del tema; sin él, solo se muestra.
 *
 * Usa TouchableRipple y no Card con onPress, como TarjetaServicio, para que el lector de
 * pantalla anuncie el elemento que se presiona.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { TemaAsesoria } from '@/types';

type Props = {
  tema: TemaAsesoria;
  onElegir?: (tema: TemaAsesoria) => void;
};

export function TarjetaTema({ tema, onElegir }: Props) {
  const textos = (
    <View style={estilos.textos}>
      <Text variant="titleMedium" style={estilos.nombre}>
        {tema.nombre}
      </Text>
      <Text variant="bodyMedium" style={estilos.descripcion}>
        {tema.descripcion}
      </Text>
    </View>
  );

  if (!onElegir) {
    return (
      <View style={estilos.tarjeta}>
        <View style={estilos.contenido}>{textos}</View>
      </View>
    );
  }

  return (
    <View style={estilos.tarjeta}>
      <TouchableRipple
        onPress={() => onElegir(tema)}
        accessibilityRole="button"
        accessibilityLabel={`${tema.nombre}. Ver franjas disponibles`}
      >
        <View style={estilos.contenido}>
          {textos}
          <Icon source="chevron-right" size={24} color={colores.textoSecundario} />
        </View>
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  tarjeta: { borderRadius: radio.tarjeta, overflow: 'hidden', backgroundColor: colores.superficie },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espacio.m, padding: espacio.m },
  textos: { flex: 1, gap: espacio.xs },
  nombre: { color: colores.texto, fontFamily: fuentes.negrita },
  descripcion: { color: colores.textoSecundario },
});
