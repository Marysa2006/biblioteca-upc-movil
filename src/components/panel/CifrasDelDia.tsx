/**
 * Las tres cifras del Dashboard (#306), en el bloque oscuro del mockup: lo que espera respuesta,
 * lo aprobado para hoy y las tablets prestadas (esta última, solo con el permiso de tablets).
 * Cada cifra dice qué es en texto, y el lector de pantalla la lee como una frase.
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { CifrasDelDia as Cifras } from '@/utils/panel';

type Props = {
  cifras: Cifras;
  /** «Hoy, lunes 23 de noviembre», encima de las cifras. */
  fecha: string;
};

export function CifrasDelDia({ cifras, fecha }: Props) {
  const items: { valor: number; texto: string }[] = [
    { valor: cifras.porRevisar, texto: 'Por revisar' },
    { valor: cifras.paraHoy, texto: 'Para hoy' },
    ...(cifras.tabletsPrestadas == null
      ? []
      : [{ valor: cifras.tabletsPrestadas, texto: 'Tablets prestadas' }]),
  ];
  return (
    <View style={estilos.bloque}>
      <Text variant="labelLarge" style={estilos.fecha}>
        {fecha}
      </Text>
      <View style={estilos.cifras}>
        {items.map((item) => (
          <View
            key={item.texto}
            style={estilos.cifra}
            accessible
            accessibilityLabel={`${item.texto}: ${item.valor}`}
          >
            <Text variant="headlineMedium" style={estilos.valor}>
              {item.valor}
            </Text>
            <Text variant="labelMedium" style={estilos.texto}>
              {item.texto}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: {
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioOscuro,
  },
  fecha: { color: colores.superficie, fontFamily: fuentes.seminegrita },
  // Con letra grande, las cifras bajan de línea en vez de cortarse.
  cifras: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  cifra: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 88,
    alignItems: 'center',
    gap: espacio.xs,
    paddingVertical: espacio.m,
    paddingHorizontal: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.primario,
  },
  valor: { color: colores.superficie, fontFamily: fuentes.negrita },
  texto: { color: colores.superficie, textAlign: 'center' },
});
