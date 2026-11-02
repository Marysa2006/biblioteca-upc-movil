/**
 * Leyenda de los estados del calendario (HU-17, CA2), con el estilo de las convenciones de la
 * agenda: los cuatro estados en una fila de columnas iguales, cada uno con su ícono en un cuadro
 * de su color y su nombre debajo. Solo explica: no se presiona ni filtra. Con letra grande, el
 * nombre pasa a otra línea dentro de su columna.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import { ESTADO_FRANJA, ORDEN_ESTADOS_FRANJA } from '@/utils/disponibilidad';

export function LeyendaDisponibilidad() {
  return (
    <View
      style={estilos.bloque}
      accessible
      accessibilityLabel="Convenciones: disponible, reservada, bloqueada y no disponible"
    >
      <Text variant="labelMedium" style={estilos.titulo}>
        CONVENCIONES
      </Text>
      <View style={estilos.fila}>
        {ORDEN_ESTADOS_FRANJA.map((estado) => {
          const { etiqueta, icono, fondo, texto } = ESTADO_FRANJA[estado];
          return (
            <View key={estado} style={estilos.item}>
              <View style={[estilos.muestra, { backgroundColor: fondo, borderColor: texto }]}>
                <Icon source={icono} size={14} color={texto} />
              </View>
              <Text variant="labelSmall" style={[estilos.nombre, { color: texto }]}>
                {etiqueta}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: {
    gap: espacio.s,
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.superficieVariante,
  },
  titulo: { color: colores.textoSecundario, fontFamily: fuentes.seminegrita },
  // Columnas iguales: los cuatro estados quedan en una sola fila y alineados.
  fila: { flexDirection: 'row', gap: espacio.xs },
  item: { flex: 1, alignItems: 'center', gap: espacio.xs },
  muestra: {
    padding: espacio.xs / 2,
    borderRadius: radio.boton / 2,
    borderWidth: 1,
  },
  nombre: { textAlign: 'center', fontFamily: fuentes.seminegrita },
});
