/**
 * Fila horizontal de chips para filtrar una lista: "Todos" más una opción por valor.
 * El elegido va con fondo oscuro y la marca de selección de Paper, no solo con color.
 */
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';

export type OpcionFiltro<T extends string> = {
  valor: T;
  etiqueta: string;
  cantidad: number;
};

type Props<T extends string> = {
  opciones: OpcionFiltro<T>[];
  valor: T;
  onCambiar: (valor: T) => void;
  /** Para el lector de pantalla, por ejemplo "Filtrar por rol". */
  descripcion: string;
};

/** Lleva el chip a 48 px de área táctil sin cambiar su tamaño visible. */
const AREA_CHIP = { top: espacio.s, bottom: espacio.s };

export function ChipsFiltro<T extends string>({ opciones, valor, onCambiar, descripcion }: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={estilos.chips}
      accessibilityLabel={descripcion}
    >
      {opciones.map((opcion) => {
        const elegido = opcion.valor === valor;
        return (
          <Chip
            key={opcion.valor}
            selected={elegido}
            onPress={() => onCambiar(opcion.valor)}
            style={elegido ? estilos.chipElegido : estilos.chip}
            selectedColor={elegido ? colores.superficie : colores.primarioOscuro}
            textStyle={estilos.texto}
            hitSlop={AREA_CHIP}
            accessibilityRole="button"
            accessibilityState={{ selected: elegido }}
            accessibilityLabel={`${opcion.etiqueta}, ${opcion.cantidad}`}
          >
            {`${opcion.etiqueta} (${opcion.cantidad})`}
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
