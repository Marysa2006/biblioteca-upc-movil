/**
 * Convenciones de la agenda (HU-15), como en el calendario de la web: los estados que aparecen
 * en una fila de columnas iguales, cada uno con un ícono en un cuadro de su color y su nombre.
 * También filtran: al tocar un estado, la agenda muestra solo esas citas; al tocarlo otra vez,
 * todas. El ícono distingue los estados aunque dos colores se parezcan (no solo color). Con
 * letra grande, el nombre pasa a otra línea dentro de su columna.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { EstadoSolicitud } from '@/types';
import { ESTADOS_AGENDA, ICONO_ESTADO_AGENDA } from '@/utils/agenda';

type Props = {
  /** El estado por el que se filtra, o null para ver todas. */
  filtro: EstadoSolicitud | null;
  onCambiar: (filtro: EstadoSolicitud | null) => void;
};

export function ConvencionesAgenda({ filtro, onCambiar }: Props) {
  return (
    <View style={estilos.bloque}>
      <Text variant="labelMedium" style={estilos.titulo}>
        {filtro ? 'CONVENCIONES · toca otra vez para ver todas' : 'CONVENCIONES · toca una para filtrar'}
      </Text>
      <View style={estilos.fila} accessibilityRole="radiogroup" accessibilityLabel="Filtrar la agenda por estado">
        {ESTADOS_AGENDA.map((estado) => {
          const { fondo, texto, etiqueta } = coloresEstado[estado];
          const elegido = filtro === estado;
          return (
            <View key={estado} style={[estilos.item, elegido && { borderColor: texto, backgroundColor: colores.superficie }]}>
              <TouchableRipple
                onPress={() => onCambiar(elegido ? null : estado)}
                style={estilos.contenido}
                accessibilityRole="radio"
                accessibilityState={{ checked: elegido }}
                accessibilityLabel={`${etiqueta}. ${elegido ? 'Mostrando solo estas citas; toca para ver todas' : 'Mostrar solo estas citas'}`}
              >
                <View style={estilos.interior}>
                  <View style={[estilos.muestra, { backgroundColor: fondo, borderColor: texto }]}>
                    <Icon source={ICONO_ESTADO_AGENDA[estado] ?? 'circle-small'} size={14} color={texto} />
                  </View>
                  <Text variant="labelMedium" style={estilos.nombre}>
                    {etiqueta}
                  </Text>
                </View>
              </TouchableRipple>
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
  fila: { flexDirection: 'row', gap: espacio.xs },
  // Columnas iguales: los tres estados quedan en una sola fila y alineados. El borde (del color
  // del fondo hasta que se elige) evita que la fila salte al elegir.
  item: {
    flex: 1,
    borderRadius: radio.boton,
    borderWidth: 1,
    borderColor: colores.superficieVariante,
    overflow: 'hidden',
  },
  // minHeight: 44 px de área táctil; crece con la letra.
  contenido: { minHeight: 44, justifyContent: 'center', paddingHorizontal: espacio.xs },
  interior: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  muestra: {
    padding: espacio.xs / 2,
    borderRadius: radio.boton / 2,
    borderWidth: 1,
  },
  nombre: { flexShrink: 1, color: colores.texto, fontFamily: fuentes.seminegrita },
});
