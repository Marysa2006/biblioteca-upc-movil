/**
 * Pestañas subrayadas para filtrar una lista ("Pendiente 3"), que se deslizan de lado.
 * Se distinguen de los chips de las secciones: la elegida va en negrita, con el color de marca
 * y una línea debajo, así que no depende solo del color. Cada pestaña mide al menos 44 px.
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';

import type { OpcionFiltro } from './ChipsFiltro';

type Props<T extends string> = {
  opciones: OpcionFiltro<T>[];
  valor: T;
  onCambiar: (valor: T) => void;
  /** Para el lector de pantalla, por ejemplo "Filtrar las solicitudes por estado". */
  descripcion: string;
};

export function PestanasFiltro<T extends string>({ opciones, valor, onCambiar, descripcion }: Props<T>) {
  return (
    <View style={estilos.barra}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        accessibilityLabel={descripcion}
      >
        {opciones.map((opcion) => {
          const elegida = opcion.valor === valor;
          return (
            <TouchableRipple
              key={opcion.valor}
              onPress={() => onCambiar(opcion.valor)}
              style={[estilos.pestana, elegida && estilos.pestanaElegida]}
              accessibilityRole="tab"
              accessibilityState={{ selected: elegida }}
              accessibilityLabel={`${opcion.etiqueta}, ${opcion.cantidad}`}
            >
              <View style={estilos.contenido}>
                <Text variant="labelLarge" style={elegida ? estilos.textoElegido : estilos.texto}>
                  {opcion.etiqueta}
                </Text>
                <Text variant="labelLarge" style={elegida ? estilos.cantidadElegida : estilos.cantidad}>
                  {opcion.cantidad}
                </Text>
              </View>
            </TouchableRipple>
          );
        })}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  // La línea gris de abajo une las pestañas; la elegida la pisa con la suya.
  barra: { borderBottomWidth: 1, borderBottomColor: colores.borde },
  // El borde inferior transparente evita que la pestaña cambie de alto al elegirla.
  pestana: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: espacio.m,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  pestanaElegida: { borderBottomColor: colores.primario },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  texto: { color: colores.textoSecundario, fontFamily: fuentes.seminegrita },
  textoElegido: { color: colores.primario, fontFamily: fuentes.negrita },
  cantidad: { color: colores.textoSecundario, fontFamily: fuentes.regular },
  cantidadElegida: { color: colores.primario, fontFamily: fuentes.negrita },
});
