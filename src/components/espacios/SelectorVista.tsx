/**
 * Selector entre las vistas de un calendario: semana y mes en el de un espacio (HU-17, CA1),
 * y día y semana en la agenda del facilitador (HU-15). Cada pantalla elige sus opciones.
 * Chips con el estilo del selector de Gestión: la etiqueta no se corta con la letra grande.
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
  /** Vistas que se ofrecen, en orden. Por defecto, semana y mes. */
  opciones?: VistaCalendario[];
};

export function SelectorVista({ valor, onCambiar, opciones = OPCIONES_ESPACIO }: Props) {
  return (
    <View style={estilos.chips} accessibilityRole="tablist" accessibilityLabel="Vista del calendario">
      {opciones.map((opcion) => {
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
