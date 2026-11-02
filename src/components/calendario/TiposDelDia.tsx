/**
 * Los compromisos de un día por tipo (HU-30): el ícono de cada servicio con su color y cuántos
 * hay. Lo usan el mes y la tira de días. Es solo visual: quien lo usa ya dice el conteo al
 * lector de pantalla con textoConteoTipos(). Con varios tipos, pasan a otra línea.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { acentoServicio, colores, espacio, fuentes } from '@/theme';
import { CATEGORIA_COMPROMISO, ICONO_COMPROMISO, type ConteoTipos } from '@/utils/miCalendario';

type Props = {
  conteo: ConteoTipos;
  /** Sobre el bloque oscuro (día elegido), todo en blanco para que se lea. */
  sobreOscuro?: boolean;
};

export function TiposDelDia({ conteo, sobreOscuro = false }: Props) {
  return (
    <View style={estilos.fila} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {conteo.tipos.map(({ tipo, cantidad }) => {
        const color = sobreOscuro ? colores.superficie : acentoServicio[CATEGORIA_COMPROMISO[tipo]];
        return (
          <View key={tipo} style={estilos.tipo}>
            <Icon source={ICONO_COMPROMISO[tipo]} size={12} color={color} />
            <Text variant="labelSmall" style={[estilos.cantidad, { color }]}>
              {cantidad}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: espacio.xs },
  tipo: { flexDirection: 'row', alignItems: 'center' },
  cantidad: { fontFamily: fuentes.seminegrita },
});
