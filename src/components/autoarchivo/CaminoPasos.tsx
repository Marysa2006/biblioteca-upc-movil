/**
 * Procedimiento de autoarchivo como camino vertical (HU-11, CA1): un círculo numerado por paso,
 * unidos por una línea. Cada paso se lee como una sola frase: "Paso 2 de 6: …".
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';

export function CaminoPasos({ pasos }: { pasos: string[] }) {
  return (
    <View>
      {pasos.map((texto, indice) => {
        const ultimo = indice === pasos.length - 1;
        return (
          <View
            key={indice}
            style={estilos.paso}
            accessible
            accessibilityLabel={`Paso ${indice + 1} de ${pasos.length}: ${texto}`}
          >
            <View style={estilos.guia}>
              <View style={estilos.circulo}>
                <Text variant="titleSmall" style={estilos.numero}>
                  {indice + 1}
                </Text>
              </View>
              {ultimo ? null : <View style={estilos.linea} />}
            </View>
            <Text variant="bodyLarge" style={[estilos.texto, ultimo ? null : estilos.separacion]}>
              {texto}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  paso: { flexDirection: 'row', gap: espacio.m },
  guia: { alignItems: 'center' },
  // minWidth y no width: con letra grande, el número agranda el círculo en vez de cortarse.
  circulo: {
    minWidth: espacio.xl,
    aspectRatio: 1,
    padding: espacio.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: espacio.xl,
    backgroundColor: colores.primarioSuave,
  },
  numero: { color: colores.primarioOscuro, fontFamily: fuentes.negrita },
  linea: { flex: 1, width: 2, marginVertical: espacio.xs, backgroundColor: colores.borde },
  texto: { flex: 1, color: colores.texto, paddingTop: espacio.xs },
  separacion: { paddingBottom: espacio.l },
});
