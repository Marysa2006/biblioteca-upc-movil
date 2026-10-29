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

import { MenuUsuario } from './MenuUsuario';

type Props = {
  titulo: string;
  subtitulo?: string;
  /** La pantalla tiene barra de navegación propia (Stack.Screen con headerShown): la barra ya cubre el borde superior. */
  conEncabezado?: boolean;
  /** Activa "deslizar hacia abajo para recargar". */
  recarga?: { recargando: boolean; onRecargar: () => void };
  /** Pantallas con formulario: el teclado no tapa los campos ni el botón de enviar. */
  conTeclado?: boolean;
  /** Oculta el menú de usuario de arriba (por ejemplo, en el login). En pantallas con barra propia no se muestra. */
  sinMenuUsuario?: boolean;
  /** Botón flotante abajo a la derecha (por ejemplo, un FAB): queda fijo al deslizar. */
  flotante?: ReactNode;
  children: ReactNode;
};

/**
 * Contenedor común de las pantallas: área segura, marca (isotipo + nombre) con el menú de usuario,
 * título y contenido desplazable.
 */
export function Pantalla({
  titulo,
  subtitulo,
  conEncabezado = false,
  recarga,
  conTeclado = false,
  sinMenuUsuario = false,
  flotante,
  children,
}: Props) {
  const contenido = (
    <ScrollView
      // Con botón flotante, el final de la lista queda libre para que no tape la última tarjeta.
      contentContainerStyle={[estilos.contenido, flotante ? estilos.contenidoConFlotante : null]}
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
        <View style={estilos.textosMarca}>
          <Text variant="titleMedium" style={estilos.nombreApp}>
            {NOMBRE_APP}
          </Text>
          <Text variant="labelSmall" style={estilos.universidad}>
            Universidad Popular del Cesar
          </Text>
        </View>
        {conEncabezado || sinMenuUsuario ? null : <MenuUsuario />}
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
      {flotante ? <View style={estilos.flotante}>{flotante}</View> : null}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: colores.fondo },
  teclado: { flex: 1 },
  contenido: { padding: espacio.m, gap: espacio.m, paddingBottom: espacio.xl },
  // El alto del botón flotante más su margen, para que el último elemento quede a la vista.
  contenidoConFlotante: { paddingBottom: espacio.xl * 3 },
  flotante: { position: 'absolute', right: espacio.m, bottom: espacio.m },
  marca: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  textosMarca: { flex: 1 },
  isotipo: { width: tamanoLogo.isotipo, aspectRatio: 1 },
  nombreApp: { color: colores.primario, fontFamily: fuentes.negrita },
  universidad: { color: colores.texto },
  encabezado: { gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  subtitulo: { color: colores.textoSecundario },
});
