/**
 * Las citas de un día por estado (HU-15): el ícono de cada estado con su color y cuántas hay,
 * como en las convenciones. Lo usan la vista Mes y la tira de días. Es solo visual: quien lo
 * usa ya dice el conteo al lector de pantalla con textoConteoDia().
 * Con varios estados, los íconos pasan a otra línea en vez de cortarse.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { colores, coloresEstado, espacio, fuentes } from '@/theme';
import { ICONO_ESTADO_AGENDA, type ConteoDia } from '@/utils/agenda';

type Props = {
  conteo: ConteoDia;
  /** Sobre el bloque oscuro (día elegido), todo en blanco para que se lea. */
  sobreOscuro?: boolean;
};

export function EstadosDelDia({ conteo, sobreOscuro = false }: Props) {
  return (
    <View style={estilos.fila} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {conteo.estados.map(({ estado, cantidad }) => {
        const color = sobreOscuro ? colores.superficie : coloresEstado[estado].texto;
        return (
          <View key={estado} style={estilos.estado}>
            <Icon source={ICONO_ESTADO_AGENDA[estado] ?? 'circle-small'} size={12} color={color} />
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
  estado: { flexDirection: 'row', alignItems: 'center' },
  cantidad: { fontFamily: fuentes.seminegrita },
});
