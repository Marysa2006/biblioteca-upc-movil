/**
 * Carrusel de fotos de Inicio (comunidad): se pasa de foto deslizando, sin avanzar solo.
 * Los puntos de abajo dicen en cuál foto se va; son visuales: el lector de pantalla
 * anuncia "Foto 1 de 3" y cambia de foto deslizando hacia arriba o hacia abajo (adjustable).
 * Sin foto (fuente null), muestra un recuadro provisional, como "Sin fotografía" en Espacios.
 */
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  View,
} from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { colores, espacio, radio } from '@/theme';
import type { ImagenInicio } from '@/utils/inicio';

type Props = { imagenes: ImagenInicio[] };

export function CarruselInicio({ imagenes }: Props) {
  const [ancho, setAncho] = useState(0);
  const [actual, setActual] = useState(0);
  const lista = useRef<ScrollViewInstance>(null);

  if (imagenes.length === 0) return null;

  const medir = (evento: LayoutChangeEvent) => setAncho(evento.nativeEvent.layout.width);

  const alTerminar = (evento: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (ancho === 0) return;
    setActual(Math.round(evento.nativeEvent.contentOffset.x / ancho));
  };

  const irA = (indice: number) => {
    const destino = Math.min(Math.max(indice, 0), imagenes.length - 1);
    lista.current?.scrollTo({ x: destino * ancho, animated: true });
    setActual(destino);
  };

  const descripcion = imagenes[actual]?.descripcion ?? '';

  return (
    <View style={estilos.carrusel}>
      <View
        style={estilos.marco}
        onLayout={medir}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`Fotos de la biblioteca. Foto ${actual + 1} de ${imagenes.length}: ${descripcion}`}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(evento) => irA(actual + (evento.nativeEvent.actionName === 'increment' ? 1 : -1))}
      >
        {ancho > 0 ? (
          <ScrollView
            ref={lista}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={alTerminar}
          >
            {imagenes.map((imagen, indice) => (
              <View key={indice} style={{ width: ancho }}>
                {imagen.fuente ? (
                  <Image source={imagen.fuente} style={estilos.foto} contentFit="cover" />
                ) : (
                  <View style={[estilos.foto, estilos.sinFoto]}>
                    <Icon source="image-outline" size={32} color={colores.textoSecundario} />
                    <Text variant="labelMedium" style={estilos.textoSinFoto}>
                      {imagen.descripcion}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={estilos.foto} />
        )}
      </View>

      {imagenes.length > 1 ? (
        <View style={estilos.puntos} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {imagenes.map((_, indice) => (
            <View key={indice} style={[estilos.punto, indice === actual && estilos.puntoActual]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  carrusel: { gap: espacio.s },
  marco: { borderRadius: radio.tarjeta, overflow: 'hidden' },
  foto: { width: '100%', aspectRatio: 16 / 9 },
  sinFoto: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.xs,
    backgroundColor: colores.superficieVariante,
  },
  textoSinFoto: { color: colores.textoSecundario },
  puntos: { flexDirection: 'row', justifyContent: 'center', gap: espacio.s },
  punto: {
    width: espacio.s,
    height: espacio.s,
    borderRadius: espacio.xs,
    backgroundColor: colores.bordeFuerte,
  },
  // El punto actual es más ancho, no solo de otro color.
  puntoActual: { width: espacio.l, backgroundColor: colores.primario },
});
