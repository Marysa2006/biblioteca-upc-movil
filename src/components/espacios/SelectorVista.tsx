/**
 * Selector entre la vista semanal y la mensual del calendario de un espacio (HU-17, CA1).
 * Chips con el estilo del selector de Gestión: la etiqueta no se corta con la letra grande.
 * El tipo también incluye 'dia' porque NavegacionPeriodo sirve a la agenda (HU-15), que tiene
 * su propio selector (SelectorVistaAgenda).
 */
import { StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';

export type VistaCalendario = 'dia' | 'semana' | 'mes';

/** Nombre de cada vista; NavegacionPeriodo también lo usa ("Semana anterior"). */
export const NOMBRE_VISTA: Record<VistaCalendario, string> = {
  dia: 'Día',
  semana: 'Semana',
  mes: 'Mes',
};

/** Las del calendario de un espacio (HU-17). */
const OPCIONES_ESPACIO: VistaCalendario[] = ['semana', 'mes'];

/** Lleva el chip a 48 px de área táctil sin cambiar su tamaño visible. */
const AREA_CHIP = { top: espacio.s, bottom: espacio.s };

type Props = {
  valor: VistaCalendario;
  onCambiar: (valor: VistaCalendario) => void;
};

export function SelectorVista({ valor, onCambiar }: Props) {
  return (
    <View style={estilos.chips} accessibilityRole="tablist" accessibilityLabel="Vista del calendario">
      {OPCIONES_ESPACIO.map((opcion) => {
        const elegida = opcion === valor;
        const etiqueta = NOMBRE_VISTA[opcion];
        return (
          <Chip
            key={opcion}
            selected={elegida}
            onPress={() => onCambiar(opcion)}
            style={elegida ? estilos.chipElegido : estilos.chip}
            selectedColor={elegida ? colores.superficie : colores.primarioOscuro}
            textStyle={estilos.texto}
            hitSlop={AREA_CHIP}
            accessibilityRole="tab"
            accessibilityState={{ selected: elegida }}
            accessibilityLabel={`Vista ${etiqueta.toLowerCase()}`}
          >
            {etiqueta}
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
