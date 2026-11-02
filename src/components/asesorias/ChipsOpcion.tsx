/**
 * Grupo de chips para elegir una opción o varias (HU-13): días, duración, cupos, tema y
 * facilitador. Las opciones que no sirven se ven desactivadas y el lector de pantalla dice por
 * qué. El elegido va con fondo oscuro y marca de selección, no solo con color.
 */
import { StyleSheet, View } from 'react-native';
import { Chip, HelperText, Text } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';

export type OpcionChip<T extends string | number> = {
  valor: T;
  etiqueta: string;
  /** Si no se puede elegir, por qué. */
  motivo?: string;
};

type Props<T extends string | number> = {
  titulo: string;
  opciones: OpcionChip<T>[];
  /** Valores elegidos: uno solo si `multiple` es false. */
  elegidos: T[];
  onCambiar: (elegidos: T[]) => void;
  multiple?: boolean;
  ayuda?: string;
  mensajeError?: string;
  deshabilitado?: boolean;
};

/** Lleva el chip a 48 px de área táctil sin cambiar su tamaño visible. */
const AREA_CHIP = { top: espacio.s, bottom: espacio.s };

export function ChipsOpcion<T extends string | number>({
  titulo,
  opciones,
  elegidos,
  onCambiar,
  multiple = false,
  ayuda,
  mensajeError,
  deshabilitado = false,
}: Props<T>) {
  const alternar = (valor: T) => {
    if (!multiple) {
      onCambiar([valor]);
      return;
    }
    onCambiar(elegidos.includes(valor) ? elegidos.filter((v) => v !== valor) : [...elegidos, valor]);
  };

  return (
    <View style={estilos.grupo}>
      <Text variant="labelLarge" style={estilos.titulo}>
        {titulo}
      </Text>
      {ayuda ? (
        <Text variant="bodySmall" style={estilos.ayuda}>
          {ayuda}
        </Text>
      ) : null}
      <View
        style={estilos.chips}
        accessibilityRole={multiple ? undefined : 'radiogroup'}
        accessibilityLabel={titulo}
      >
        {opciones.map((opcion) => {
          const elegida = elegidos.includes(opcion.valor);
          const bloqueada = deshabilitado || (opcion.motivo != null && !elegida);
          return (
            <Chip
              key={String(opcion.valor)}
              selected={elegida}
              onPress={() => alternar(opcion.valor)}
              disabled={bloqueada}
              style={elegida ? estilos.chipElegido : estilos.chip}
              selectedColor={elegida ? colores.superficie : colores.primarioOscuro}
              textStyle={estilos.texto}
              hitSlop={AREA_CHIP}
              accessibilityRole={multiple ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: elegida, disabled: bloqueada }}
              accessibilityLabel={`${opcion.etiqueta}${opcion.motivo ? `, no disponible: ${opcion.motivo}` : ''}`}
            >
              {opcion.etiqueta}
            </Chip>
          );
        })}
      </View>
      <HelperText type="error" visible={mensajeError != null}>
        {mensajeError ?? ''}
      </HelperText>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espacio.s },
  titulo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  ayuda: { color: colores.textoSecundario },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  chip: { backgroundColor: colores.primarioSuave },
  chipElegido: { backgroundColor: colores.primarioOscuro },
  texto: { fontFamily: fuentes.seminegrita },
});
