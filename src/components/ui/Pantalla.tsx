import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colores, espacio, fuentes, tamanoLogo } from '@/theme';
import { NOMBRE_APP } from '@/utils/constantes';

type Props = {
  titulo: string;
  subtitulo?: string;
  /** La pantalla tiene barra de navegación propia (Stack.Screen con headerShown): la barra ya cubre el borde superior. */
  conEncabezado?: boolean;
  /** Activa "deslizar hacia abajo para recargar". */
  recarga?: { recargando: boolean; onRecargar: () => void };
  /** Pantallas con formulario: el teclado no tapa los campos ni el botón de enviar. */
  conTeclado?: boolean;
  children: ReactNode;
};

/** Contenedor común de las pantallas: área segura, marca (isotipo + nombre), título y contenido desplazable. */
export function Pantalla({
  titulo,
  subtitulo,
  conEncabezado = false,
  recarga,
  conTeclado = false,
  children,
}: Props) {
  const contenido = (
    <ScrollView
      contentContainerStyle={estilos.contenido}
      // Con el teclado abierto, el primer toque en un botón lo presiona (y no solo cierra el teclado).
      keyboardShouldPersistTaps="handled"
      refreshControl={
        recarga ? (
          <RefreshControl
            refreshing={recarga.recargando}
            onRefresh={recarga.onRecargar}
            colors={[colores.primario]}
            tintColor={colores.primario}
          />
        ) : undefined
      }
    >
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
  );

  return (
    <SafeAreaView style={estilos.area} edges={conEncabezado ? [] : ['top']}>
      {conTeclado ? (
        // Según la guía de Expo: 'padding' en iOS; en Android basta con el componente.
        <KeyboardAvoidingView
          style={estilos.teclado}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {contenido}
        </KeyboardAvoidingView>
      ) : (
        contenido
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: colores.fondo },
  teclado: { flex: 1 },
  contenido: { padding: espacio.m, gap: espacio.m, paddingBottom: espacio.xl },
  marca: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  isotipo: { width: tamanoLogo.isotipo, aspectRatio: 1 },
  nombreApp: { color: colores.primario, fontFamily: fuentes.negrita },
  universidad: { color: colores.texto },
  encabezado: { gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  subtitulo: { color: colores.textoSecundario },
});
