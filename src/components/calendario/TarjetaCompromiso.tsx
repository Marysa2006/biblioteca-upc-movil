/**
 * Un compromiso en Mi calendario (HU-30, CA1): la hora, el tipo de servicio (ícono, color y
 * nombre, no solo color), qué es, dónde y un dato más. No se presiona: es para consultar.
 * Un préstamo vencido lo dice en texto, con el color de rechazada.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { acentoServicio, colores, coloresEstado, espacio, fondoServicio, fuentes, radio } from '@/theme';
import {
  CATEGORIA_COMPROMISO,
  ICONO_COMPROMISO,
  NOMBRE_COMPROMISO,
  type Compromiso,
} from '@/utils/miCalendario';

type Props = { compromiso: Compromiso };

export function TarjetaCompromiso({ compromiso }: Props) {
  const categoria = CATEGORIA_COMPROMISO[compromiso.tipo];
  const nombreTipo = NOMBRE_COMPROMISO[compromiso.tipo];
  const esTablet = compromiso.tipo === 'tablet';
  const horas = esTablet
    ? `${compromiso.horaInicio} – ${compromiso.horaFin} (límite)`
    : `${compromiso.horaInicio} – ${compromiso.horaFin}`;
  const partes = [horas, nombreTipo, compromiso.titulo, compromiso.lugar, compromiso.detalle];
  if (compromiso.vencido) partes.splice(2, 0, 'Vencido');

  return (
    <View style={estilos.tarjeta} accessible accessibilityLabel={partes.filter(Boolean).join('. ')}>
      <View style={estilos.encabezado}>
        <Text variant="titleSmall" style={estilos.horas}>
          {horas}
        </Text>
        <View style={estilos.etiquetas}>
          {compromiso.vencido ? (
            <View style={estilos.vencido}>
              <Text variant="labelMedium" style={estilos.textoVencido}>
                Vencido
              </Text>
            </View>
          ) : null}
          {/* Sobre el fondo del servicio, el texto va en colores.texto; el acento, en el ícono. */}
          <View style={[estilos.tipo, { backgroundColor: fondoServicio[categoria] }]}>
            <Icon source={ICONO_COMPROMISO[compromiso.tipo]} size={16} color={acentoServicio[categoria]} />
            <Text variant="labelMedium" style={estilos.textoTipo}>
              {nombreTipo}
            </Text>
          </View>
        </View>
      </View>
      <Text variant="titleMedium" style={estilos.titulo}>
        {compromiso.titulo}
      </Text>
      <View style={estilos.lugar}>
        <Icon source="map-marker-outline" size={16} color={colores.textoSecundario} />
        <Text variant="bodyMedium" style={estilos.textoLugar}>
          {compromiso.lugar}
        </Text>
      </View>
      {compromiso.detalle ? (
        <Text variant="bodySmall" style={estilos.detalle}>
          {compromiso.detalle}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.xs,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  // Con letra grande, las etiquetas bajan a la línea siguiente.
  encabezado: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
  },
  horas: { color: colores.primario, fontFamily: fuentes.seminegrita },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.xs },
  tipo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs,
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs,
    borderRadius: radio.boton,
  },
  textoTipo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  vencido: {
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs,
    borderRadius: radio.boton,
    backgroundColor: coloresEstado.rechazada.fondo,
  },
  textoVencido: { color: coloresEstado.rechazada.texto, fontFamily: fuentes.seminegrita },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  lugar: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  textoLugar: { flex: 1, color: colores.texto },
  detalle: { color: colores.textoSecundario },
});
