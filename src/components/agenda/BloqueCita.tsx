/**
 * Una cita en la malla de la semana (HU-15): un bloque del color de su estado, con el ícono
 * del estado (no solo color), el tema, la hora y, si cabe, el facilitador o el solicitante.
 * La posición y el alto los decide MallaSemana. Se presiona entero y abre el detalle (CA2);
 * el lector dice todo aunque el texto no quepa en el bloque.
 */
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { Cita } from '@/types';
import { ICONO_ESTADO_AGENDA } from '@/utils/agenda';

/** Por debajo de este alto (px), el bloque muestra solo el tema y la hora en una línea cada uno. */
const ALTO_PARA_TERCERA_LINEA = 64;

type Props = {
  cita: Cita;
  /** top, left, width y height dentro de la columna del día. */
  posicion: ViewStyle & { height: number };
  mostrarFacilitador: boolean;
  onAbrir: (cita: Cita) => void;
};

export function BloqueCita({ cita, posicion, mostrarFacilitador, onAbrir }: Props) {
  const { fondo, texto, etiqueta } = coloresEstado[cita.estado];
  const horas = `${cita.horaInicio} – ${cita.horaFin}`;
  const persona = mostrarFacilitador ? cita.facilitador : cita.solicitante;

  return (
    <View style={[estilos.bloque, posicion, { backgroundColor: fondo, borderLeftColor: texto }]}>
      <TouchableRipple
        onPress={() => onAbrir(cita)}
        style={estilos.toque}
        accessibilityRole="button"
        accessibilityLabel={`${horas}, ${cita.tema}, ${cita.solicitante}${mostrarFacilitador ? `, con ${cita.facilitador}` : ''}. ${etiqueta}. Ver el detalle`}
      >
        <View style={estilos.contenido}>
          <View style={estilos.fila}>
            <Icon
              source={ICONO_ESTADO_AGENDA[cita.estado] ?? 'circle-small'}
              size={12}
              color={texto}
            />
            <Text variant="labelMedium" numberOfLines={1} style={[estilos.tema, { color: texto }]}>
              {cita.tema}
            </Text>
          </View>
          <Text variant="labelSmall" numberOfLines={1} style={{ color: texto }}>
            {horas}
          </Text>
          {posicion.height >= ALTO_PARA_TERCERA_LINEA ? (
            <Text variant="labelSmall" numberOfLines={1} style={{ color: texto }}>
              {persona}
            </Text>
          ) : null}
        </View>
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  // overflow: 'hidden' recorta el ripple y el texto que no cabe al borde del bloque.
  bloque: {
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: radio.boton / 2,
    borderLeftWidth: 3,
  },
  toque: { flex: 1 },
  contenido: { flex: 1, paddingHorizontal: espacio.xs, paddingVertical: espacio.xs / 2 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs / 2 },
  tema: { flexShrink: 1, fontFamily: fuentes.seminegrita },
});
