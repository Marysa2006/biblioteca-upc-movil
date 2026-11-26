import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colores, espacio, radio } from '@/theme';

import { AvisoConexionLenta } from './Estados';

type Forma = 'tarjeta' | 'linea' | 'lista' | 'cuadricula' | 'grafica';

export function Esqueleto({ forma = 'lista', mensaje = 'Cargando…' }: { forma?: Forma; mensaje?: string }) {
  const [opacidad] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let vigente = true;
    let cambioRecibido = false;
    const animacion = Animated.loop(Animated.sequence([
      Animated.timing(opacidad, { toValue: 0.55, duration: 900, useNativeDriver: true, isInteraction: false }),
      Animated.timing(opacidad, { toValue: 1, duration: 900, useNativeDriver: true, isInteraction: false }),
    ]));
    function aplicar(reducir: boolean) {
      if (!vigente) return;
      animacion.stop();
      opacidad.setValue(1);
      if (!reducir) animacion.start();
    }
    const suscripcion = AccessibilityInfo.addEventListener('reduceMotionChanged', (reducir) => {
      cambioRecibido = true;
      aplicar(reducir);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((reducir) => {
      if (!cambioRecibido) aplicar(reducir);
    }).catch(() => {});
    return () => {
      vigente = false;
      suscripcion.remove();
      animacion.stop();
    };
  }, [opacidad]);

  const cantidad = forma === 'cuadricula' ? 4 : forma === 'lista' ? 3 : 1;
  return (
    <View style={estilos.grupo}>
      <Text variant="bodyMedium" accessibilityLiveRegion="polite" style={estilos.mensaje}>{mensaje}</Text>
      <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={[estilos.grupo, forma === 'cuadricula' && estilos.cuadricula, { opacity: opacidad }]}>
        {Array.from({ length: cantidad }, (_, i) => forma === 'linea' ? (
          <View key={i} style={[estilos.linea, estilos.titulo]} />
        ) : (
          <View key={i} style={[estilos.tarjeta, forma === 'cuadricula' && estilos.celda]}>
            <View style={[estilos.linea, estilos.titulo]} />
            <View style={estilos.linea} />
            {forma === 'grafica' ? <View style={estilos.grafica} /> : <View style={[estilos.linea, estilos.corta]} />}
          </View>
        ))}
      </Animated.View>
      <AvisoConexionLenta />
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espacio.s },
  mensaje: { color: colores.textoSecundario },
  tarjeta: { padding: espacio.m, gap: espacio.s, borderRadius: radio.tarjeta, backgroundColor: colores.superficie },
  linea: { height: 12, borderRadius: radio.boton, backgroundColor: colores.superficieVariante },
  titulo: { width: '65%', height: 16 },
  corta: { width: '43%' },
  cuadricula: { flexDirection: 'row', flexWrap: 'wrap' },
  celda: { flexBasis: '45%', flexGrow: 1 },
  grafica: { height: 96, borderRadius: radio.boton, backgroundColor: colores.superficieVariante },
});
