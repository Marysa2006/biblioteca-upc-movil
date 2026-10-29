/**
 * Las convenciones de Mi calendario (HU-30): qué significa cada ícono de la tira y del mes.
 * Con el estilo de las convenciones de la agenda: los tipos en una fila de columnas iguales,
 * cada uno con su ícono en un cuadro de su color y su nombre al lado. No se presionan. Con
 * letra grande, el nombre pasa a otra línea dentro de su columna.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { acentoServicio, colores, espacio, fondoServicio, fuentes, radio } from '@/theme';
import {
  CATEGORIA_COMPROMISO,
  ICONO_COMPROMISO,
  NOMBRE_COMPROMISO,
  TIPOS_COMPROMISO,
} from '@/utils/miCalendario';

export function ConvencionesCalendario() {
  return (
    <View
      style={estilos.bloque}
      accessible
      accessibilityLabel={`Convenciones: ${TIPOS_COMPROMISO.map((tipo) => NOMBRE_COMPROMISO[tipo].toLowerCase()).join(', ')}`}
    >
      <Text variant="labelMedium" style={estilos.titulo}>
        CONVENCIONES
      </Text>
      <View style={estilos.fila}>
        {TIPOS_COMPROMISO.map((tipo) => {
          const categoria = CATEGORIA_COMPROMISO[tipo];
          return (
            <View key={tipo} style={estilos.item}>
              <View
                style={[
                  estilos.muestra,
                  { backgroundColor: fondoServicio[categoria], borderColor: acentoServicio[categoria] },
                ]}
              >
                <Icon source={ICONO_COMPROMISO[tipo]} size={14} color={acentoServicio[categoria]} />
              </View>
              <Text variant="labelMedium" style={estilos.nombre}>
                {NOMBRE_COMPROMISO[tipo]}
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
  // Columnas iguales: los tres tipos quedan en una sola fila y alineados.
  fila: { flexDirection: 'row', gap: espacio.xs },
  // minHeight: mide como las convenciones de la agenda, aunque aquí no se presionan.
  item: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs,
    paddingHorizontal: espacio.xs,
  },
  muestra: {
    padding: espacio.xs / 2,
    borderRadius: radio.boton / 2,
    borderWidth: 1,
  },
  nombre: { flexShrink: 1, color: colores.texto, fontFamily: fuentes.seminegrita },
});
