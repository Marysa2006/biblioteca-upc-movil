import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colores, espacio, fuentes, tamanoLogo } from '@/theme';
import { NOMBRE_APP } from '@/utils/constantes';

type Props = {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
};

/** Contenedor común de las pantallas: área segura, marca (isotipo + nombre), título y contenido desplazable. */
export function Pantalla({ titulo, subtitulo, children }: Props) {
  return (
    <SafeAreaView style={estilos.area} edges={['top']}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={estilos.marca}>
          {/* Decorativo: el nombre ya va escrito al lado, así que no lleva accessibilityLabel. */}
          <Image
            source={require('@/assets/images/isotipo-upc.png')}
            style={estilos.isotipo}
            contentFit="contain"
          />
          <View>
            <Text variant="titleMedium" style={estilos.nombreApp}>
              {NOMBRE_APP}
            </Text>
            <Text variant="labelSmall" style={estilos.universidad}>
              Universidad Popular del Cesar
            </Text>
          </View>
        </View>
        <View style={estilos.encabezado}>
          <Text variant="headlineSmall" style={estilos.titulo}>
            {titulo}
          </Text>
          {subtitulo ? (
            <Text variant="bodyMedium" style={estilos.subtitulo}>
              {subtitulo}
            </Text>
          ) : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: espacio.m, gap: espacio.m, paddingBottom: espacio.xl },
  marca: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  isotipo: { width: tamanoLogo.isotipo, aspectRatio: 1 },
  nombreApp: { color: colores.primario, fontFamily: fuentes.negrita },
  universidad: { color: colores.texto },
  encabezado: { gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  subtitulo: { color: colores.textoSecundario },
});
