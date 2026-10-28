/**
 * Día, Semana o Mes en la agenda del facilitador (HU-15). Es un control segmentado, distinto de
 * los chips de Gestión, para que no parezca parte del selector de secciones.
 * Los segmentos se reparten el ancho y, con letra grande, el texto pasa a otra línea en lugar
 * de cortarse (no se usa SegmentedButtons por eso).
 */
import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';

import { NOMBRE_VISTA } from '@/components/espacios/SelectorVista';
import { colores, espacio, fuentes, radio } from '@/theme';

export type VistaAgenda = 'dia' | 'semana' | 'mes';

const OPCIONES: VistaAgenda[] = ['dia', 'semana', 'mes'];

type Props = {
  valor: VistaAgenda;
  onCambiar: (valor: VistaAgenda) => void;
};

export function SelectorVistaAgenda({ valor, onCambiar }: Props) {
  return (
    <View style={estilos.control} accessibilityRole="tablist" accessibilityLabel="Vista de la agenda">
      {OPCIONES.map((opcion) => {
        const elegida = opcion === valor;
        const etiqueta = NOMBRE_VISTA[opcion];
        return (
          <TouchableRipple
            key={opcion}
            onPress={() => onCambiar(opcion)}
            style={[estilos.segmento, elegida && estilos.segmentoElegido]}
            accessibilityRole="tab"
            accessibilityState={{ selected: elegida }}
            accessibilityLabel={`Vista por ${etiqueta.toLowerCase()}`}
          >
            <Text variant="labelLarge" style={[estilos.texto, elegida && estilos.textoElegido]}>
              {etiqueta}
            </Text>
          </TouchableRipple>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  control: {
    flexDirection: 'row',
    gap: espacio.xs,
    padding: espacio.xs,
    borderRadius: radio.boton,
    backgroundColor: colores.superficieVariante,
  },
  // minHeight y no height: con letra grande el segmento crece. 44 px de área táctil.
  segmento: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: espacio.s,
    borderRadius: radio.boton,
  },
  segmentoElegido: { backgroundColor: colores.superficie },
  texto: { color: colores.textoSecundario, fontFamily: fuentes.seminegrita, textAlign: 'center' },
  textoElegido: { color: colores.primario },
});
