/**
 * Selector entre la vista semanal y la mensual del calendario de un espacio (HU-17, CA1).
 * Chips con el estilo del selector de Gestión: la etiqueta no se corta con la letra grande.
 */
import { StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';

export type VistaCalendario = 'semana' | 'mes';

const OPCIONES: { valor: VistaCalendario; etiqueta: string }[] = [
  { valor: 'semana', etiqueta: 'Semana' },
  { valor: 'mes', etiqueta: 'Mes' },
];

/** Lleva el chip a 48 px de área táctil sin cambiar su tamaño visible. */
const AREA_CHIP = { top: espacio.s, bottom: espacio.s };

type Props = {
  valor: VistaCalendario;
  onCambiar: (valor: VistaCalendario) => void;
};

export function SelectorVista({ valor, onCambiar }: Props) {
  return (
    <View style={estilos.chips} accessibilityRole="tablist" accessibilityLabel="Vista del calendario">
      {OPCIONES.map((opcion) => {
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
            accessibilityLabel={`Vista ${opcion.etiqueta.toLowerCase()}`}
          >
            {opcion.etiqueta}
          </Chip>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s, paddingVertical: espacio.xs },
  chip: { backgroundColor: colores.primarioSuave },
  chipElegido: { backgroundColor: colores.primarioOscuro },
  texto: { fontFamily: fuentes.seminegrita },
});
