/**
 * Pestañas subrayadas que se deslizan de lado, por ejemplo las secciones de Gestión.
 * Se distinguen de los chips de filtro: la elegida va en negrita, con el color de marca
 * y una línea debajo, así que no depende solo del color. Cada pestaña mide al menos 44 px.
 * Si la opción trae cantidad, se muestra al lado ("Pendiente 3").
 * Con `alerta`, la pestaña lleva un ícono de aviso y el lector dice que tiene campos por revisar.
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';

export type OpcionPestana<T extends string> = {
  valor: T;
  etiqueta: string;
  cantidad?: number;
  /** Por ejemplo, una pestaña de un formulario con errores. */
  alerta?: boolean;
};

type Props<T extends string> = {
  opciones: OpcionPestana<T>[];
  valor: T;
  onCambiar: (valor: T) => void;
  /** Para el lector de pantalla, por ejemplo "Secciones de Gestión". */
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
              accessibilityLabel={[
                opcion.etiqueta,
                opcion.cantidad == null ? null : String(opcion.cantidad),
                opcion.alerta ? 'tiene campos por revisar' : null,
              ]
                .filter(Boolean)
                .join(', ')}
            >
              <View style={estilos.contenido}>
                {opcion.alerta ? (
                  <Icon source="alert-circle-outline" size={18} color={colores.error} />
                ) : null}
                <Text variant="labelLarge" style={elegida ? estilos.textoElegido : estilos.texto}>
                  {opcion.etiqueta}
                </Text>
                {opcion.cantidad == null ? null : (
                  <Text
                    variant="labelLarge"
                    style={elegida ? estilos.cantidadElegida : estilos.cantidad}
                  >
                    {opcion.cantidad}
                  </Text>
                )}
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
