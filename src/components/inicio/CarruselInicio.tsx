/**
 * Carrusel de fotos de Inicio (comunidad): se pasa de foto deslizando, sin avanzar solo.
 * Los puntos de abajo dicen en cuál foto se va; son visuales: el lector de pantalla
 * anuncia "Foto 1 de 3" y cambia de foto deslizando hacia arriba o hacia abajo (adjustable).
 * Sin foto (fuente null), muestra un recuadro provisional, como "Sin fotografía" en Espacios.
 * Desde la 1.1 (#290) las fotos llegan de la biblioteca: si una no carga (enlace caído o sin
 * conexión), en su lugar va ese mismo recuadro con su descripción.
 */
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  View,
} from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { Upecito } from '@/components/ui';
import { colores, espacio, radio } from '@/theme';
import type { ImagenInicio } from '@/utils/inicio';

type Props = { imagenes: ImagenInicio[] };

export function CarruselInicio({ imagenes }: Props) {
  const { fontScale } = useWindowDimensions();
  const letraGrande = fontScale >= 1.35;
  const [ancho, setAncho] = useState(0);
  const [indice, setActual] = useState(0);
  const lista = useRef<ScrollViewInstance>(null);

  // Las fotos que no cargaron (URL caída o sin conexión), por su dirección.
  const [fallidas, setFallidas] = useState<string[]>([]);

  if (imagenes.length === 0) {
    return (
      <View style={estilos.carrusel}>
        <View style={[estilos.foto, estilos.bienvenida, letraGrande && estilos.bienvenidaVertical]}>
          <Upecito pose="saludando" tamano={letraGrande ? 'encabezado' : 'grande'} />
          <Text variant="titleMedium" style={[estilos.saludo, letraGrande && estilos.saludoCentrado]}>
            ¡Hola! Te damos la bienvenida a la Biblioteca de la UPC.
          </Text>
        </View>
        <View style={estilos.puntos} />
      </View>
    );
  }
  // Si la lista se acortó (se ocultó una foto), vuelve a la primera.
  const actual = indice < imagenes.length ? indice : 0;

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
            {imagenes.map((imagen, posicion) => (
              <View key={posicion} style={{ width: ancho }}>
                {imagen.fuente && !fallidas.includes(claveDe(imagen.fuente)) ? (
                  <Image
                    source={imagen.fuente}
                    style={estilos.foto}
                    contentFit="cover"
                    onError={() => {
                      const clave = claveDe(imagen.fuente);
                      setFallidas((antes) => (antes.includes(clave) ? antes : [...antes, clave]));
                    }}
                  />
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

      <View style={estilos.puntos} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {imagenes.length > 1 && imagenes.map((_, posicion) => (
            <View
              key={posicion}
              style={[estilos.punto, posicion === actual && estilos.puntoActual]}
            />
          ))}
        </View>
    </View>
  );
}

/** Con qué se reconoce una foto: el número del require o su URL. */
function claveDe(fuente: ImagenInicio['fuente']): string {
  if (fuente == null) return '';
  if (typeof fuente === 'number' || typeof fuente === 'string') return String(fuente);
  if (Array.isArray(fuente)) {
    return fuente.map((parte) => (typeof parte === 'string' ? parte : (parte?.uri ?? ''))).join(',');
  }
  return 'uri' in fuente ? (fuente.uri ?? '') : '';
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
  bienvenida: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: espacio.s, padding: espacio.m, backgroundColor: colores.primarioSuave, borderRadius: radio.tarjeta },
  bienvenidaVertical: { flexDirection: 'column', gap: espacio.xs, padding: espacio.s },
  saludoCentrado: { flex: 0, textAlign: 'center' },
  saludo: { flex: 1, color: colores.primarioOscuro },
  puntos: { minHeight: espacio.s, flexDirection: 'row', justifyContent: 'center', gap: espacio.s },
  punto: {
    width: espacio.s,
    height: espacio.s,
    borderRadius: espacio.xs,
    backgroundColor: colores.bordeFuerte,
  },
  // El punto actual es más ancho, no solo de otro color.
  puntoActual: { width: espacio.l, backgroundColor: colores.primario },
});
