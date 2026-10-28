/**
 * Convenciones de la agenda (HU-15), como en el calendario de la web: los estados que aparecen
 * en una fila de columnas iguales, cada uno con un ícono en un cuadro de su color y su nombre.
 * El ícono distingue los estados aunque dos colores se parezcan (no solo color). Con letra
 * grande, el nombre pasa a otra línea dentro de su columna.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { EstadoSolicitud } from '@/types';
import { ESTADOS_AGENDA } from '@/utils/agenda';

/** Ícono de cada estado de la agenda. */
const ICONO_ESTADO: Partial<Record<EstadoSolicitud, string>> = {
  pendiente: 'clock-outline',
  aprobada: 'check',
  realizada: 'check-all',
};

export function ConvencionesAgenda() {
  return (
    <View style={estilos.bloque} accessible accessibilityLabel="Convenciones: pendiente, aprobada y realizada">
      <Text variant="labelMedium" style={estilos.titulo}>
        CONVENCIONES
      </Text>
      <View style={estilos.fila}>
        {ESTADOS_AGENDA.map((estado) => {
          const { fondo, texto, etiqueta } = coloresEstado[estado];
          return (
            <View key={estado} style={estilos.item}>
              <View style={[estilos.muestra, { backgroundColor: fondo, borderColor: texto }]}>
                <Icon source={ICONO_ESTADO[estado] ?? 'circle-small'} size={14} color={texto} />
              </View>
              <Text variant="labelMedium" style={estilos.nombre}>
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
  fila: { flexDirection: 'row', gap: espacio.s },
  // Columnas iguales: los tres estados quedan en una sola fila y alineados.
  item: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  muestra: {
    padding: espacio.xs / 2,
    borderRadius: radio.boton / 2,
    borderWidth: 1,
  },
  nombre: { flexShrink: 1, color: colores.texto, fontFamily: fuentes.seminegrita },
});
