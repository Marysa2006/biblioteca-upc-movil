/**
 * Selector de las secciones de Gestión: una fila de chips que se desplaza de lado.
 * Reemplaza a SegmentedButtons, que corta la etiqueta con la letra grande.
 * El elegido va con fondo oscuro y la marca de selección de Paper, no solo con color.
 */
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';

export type OpcionSeccion<T extends string> = {
  valor: T;
  etiqueta: string;
};

type Props<T extends string> = {
  opciones: OpcionSeccion<T>[];
  valor: T;
  onCambiar: (valor: T) => void;
};

/** Lleva el chip a 48 px de área táctil sin cambiar su tamaño visible. */
const AREA_CHIP = { top: espacio.s, bottom: espacio.s };

export function SelectorSeccion<T extends string>({ opciones, valor, onCambiar }: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={estilos.chips}
      accessibilityRole="tablist"
      accessibilityLabel="Secciones de Gestión"
    >
      {opciones.map((opcion) => {
        const elegida = opcion.valor === valor;
        return (
          <Chip
            key={opcion.valor}
            selected={elegida}
            onPress={() => onCambiar(opcion.valor)}
            style={elegida ? estilos.chipElegido : estilos.chip}
            selectedColor={elegida ? colores.superficie : colores.primarioOscuro}
            textStyle={estilos.texto}
            hitSlop={AREA_CHIP}
            accessibilityRole="tab"
            accessibilityState={{ selected: elegida }}
            accessibilityLabel={opcion.etiqueta}
          >
            {opcion.etiqueta}
          </Chip>
        );
      })}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  chips: { gap: espacio.s, paddingVertical: espacio.xs },
  chip: { backgroundColor: colores.primarioSuave },
  chipElegido: { backgroundColor: colores.primarioOscuro },
  texto: { fontFamily: fuentes.seminegrita },
});
