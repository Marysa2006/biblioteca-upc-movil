/**
 * Tarjeta de una fuente en la pestaña Catálogo (Koha, repositorio, recursos en línea o guías):
 * ícono, nombre y qué se encuentra allí. Al tocarla se abre la pantalla de esa fuente.
 * La marca opcional destaca algo de la fuente con ícono y texto, por ejemplo
 * "Disponible sin conexión" en las guías (HU-29).
 *
 * Usa TouchableRipple y no Card con onPress, como TarjetaRecurso.
 */
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';

type FuenteIcono = ComponentProps<typeof Icon>['source'];

type Props = {
  icono: FuenteIcono;
  titulo: string;
  descripcion: string;
  marca?: { icono: FuenteIcono; texto: string };
  onPress: () => void;
};

export function TarjetaFuente({ icono, titulo, descripcion, marca, onPress }: Props) {
  return (
    <View style={estilos.tarjeta}>
      <TouchableRipple
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={[titulo, marca?.texto, descripcion].filter(Boolean).join('. ')}
      >
        <View style={estilos.contenido}>
          <View style={estilos.cuadroIcono}>
            <Icon source={icono} size={28} color={colores.primario} />
          </View>
          <View style={estilos.textos}>
            <Text variant="titleMedium" style={estilos.titulo}>
              {titulo}
            </Text>
            {marca ? (
              <View style={estilos.marca}>
                <Icon source={marca.icono} size={14} color={colores.primarioOscuro} />
                <Text variant="labelMedium" style={estilos.textoMarca}>
                  {marca.texto}
                </Text>
              </View>
            ) : null}
            <Text variant="bodyMedium" style={estilos.descripcion}>
              {descripcion}
            </Text>
          </View>
          <Icon source="chevron-right" size={24} color={colores.textoSecundario} />
        </View>
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  tarjeta: { backgroundColor: colores.superficie, borderRadius: radio.tarjeta, overflow: 'hidden' },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espacio.m, padding: espacio.m },
  cuadroIcono: {
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  textos: { flex: 1, gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  // alignSelf: la marca mide lo que su texto, no todo el ancho.
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: espacio.xs,
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs / 2,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  // flexShrink: con letra grande, el texto pasa a otra línea en lugar de salirse.
  textoMarca: { flexShrink: 1, color: colores.primarioOscuro },
  descripcion: { color: colores.textoSecundario },
});
