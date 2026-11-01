/**
 * Un resultado de búsqueda del Catálogo: un libro de Koha (HU-02) o un trabajo del
 * repositorio (HU-11). Muestra el título, el autor y el año. Al tocarla, la pantalla abre su
 * página en el navegador integrado.
 *
 * Usa TouchableRipple y no Card con onPress, como TarjetaRecurso.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { ResultadoBusqueda } from '@/utils/busqueda';

type Props = {
  resultado: ResultadoBusqueda;
  /** Para el lector de pantalla, por ejemplo "Abre la ficha en el catálogo". */
  accion: string;
  onPress: () => void;
};

export function TarjetaResultado({ resultado, accion, onPress }: Props) {
  const detalles = [resultado.autor, resultado.anio].filter(Boolean);

  return (
    <View style={estilos.tarjeta}>
      <TouchableRipple
        onPress={onPress}
        accessibilityRole="link"
        accessibilityLabel={[resultado.titulo, ...detalles, accion].join('. ')}
      >
        <View style={estilos.contenido}>
          <View style={estilos.textos}>
            <Text variant="titleSmall" style={estilos.titulo} numberOfLines={3}>
              {resultado.titulo}
            </Text>
            {resultado.autor ? (
              <Text variant="bodyMedium" style={estilos.detalle} numberOfLines={2}>
                {resultado.autor}
              </Text>
            ) : null}
            {resultado.anio ? (
              <Text variant="bodySmall" style={estilos.detalle}>
                {resultado.anio}
              </Text>
            ) : null}
          </View>
          <Icon source="open-in-new" size={20} color={colores.textoSecundario} />
        </View>
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  tarjeta: { backgroundColor: colores.superficie, borderRadius: radio.tarjeta, overflow: 'hidden' },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espacio.m, padding: espacio.m },
  textos: { flex: 1, gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  detalle: { color: colores.textoSecundario },
});
