import { Image } from 'expo-image';
import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  View,
} from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colores, espacio, fuentes, radio, tamanoLogo } from '@/theme';
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
  /**
   * Botón flotante abajo a la derecha (por ejemplo, un FAB): queda fijo al deslizar.
   * Como función, recibe si el contenido ya se deslizó hacia abajo, para encogerse.
   */
  flotante?: ReactNode | ((desplazada: boolean) => ReactNode);
  /**
   * Acciones fijas abajo (por ejemplo, las de un detalle): una tarjeta flotante sobre el
   * contenido, justo encima de la barra de navegación del sistema, sin taparla. El final del
   * contenido queda libre para que la tarjeta no tape lo último.
   */
  pie?: ReactNode;
  children: ReactNode;
};

/** Sube el contenido de la pantalla al inicio; fuera de una Pantalla no hace nada. */
const SubirAlInicio = createContext<() => void>(() => {});

/** Para que un componente dentro de la pantalla (por ejemplo, Paginacion) la suba al inicio. */
export function useSubirAlInicio(): () => void {
  return useContext(SubirAlInicio);
}

/** Cuánto hay que deslizar (en px) para que el botón flotante se encoja. */
const DESPLAZAMIENTO_PARA_ENCOGER = espacio.xl;

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
  pie,
  children,
}: Props) {
  const { bottom } = useSafeAreaInsets();
  // Alto de la tarjeta del pie, para dejar ese espacio libre al final del contenido.
  const [altoPie, setAltoPie] = useState(0);
  // Si el contenido ya bajó un poco, para que el botón flotante se encoja y deje ver la lista.
  const [desplazada, setDesplazada] = useState(false);
  const desplazable = useRef<ScrollViewInstance>(null);
  const subirAlInicio = useCallback(() => desplazable.current?.scrollTo({ y: 0, animated: true }), []);
  const alDesplazar =
    typeof flotante === 'function'
      ? ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) =>
          setDesplazada(nativeEvent.contentOffset.y > DESPLAZAMIENTO_PARA_ENCOGER)
      : undefined;

  const contenido = (
    <ScrollView
      ref={desplazable}
      // Con botón flotante, el final de la lista queda libre para que no tape la última tarjeta.
      contentContainerStyle={[
        estilos.contenido,
        flotante ? estilos.contenidoConFlotante : null,
        pie ? { paddingBottom: altoPie + bottom + espacio.xl } : null,
      ]}
      onScroll={alDesplazar}
      scrollEventThrottle={alDesplazar ? 16 : undefined}
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
      <SubirAlInicio.Provider value={subirAlInicio}>{children}</SubirAlInicio.Provider>
    </ScrollView>
  );

  const conPie = pie ? (
    <>
      {contenido}
      <Surface
        elevation={2}
        style={[estilos.pie, { bottom: bottom + espacio.s }]}
        onLayout={({ nativeEvent }) => setAltoPie(nativeEvent.layout.height)}
      >
        {pie}
      </Surface>
    </>
  ) : (
    contenido
  );

  return (
    <SafeAreaView style={estilos.area} edges={conEncabezado ? [] : ['top']}>
      {conTeclado ? (
        // Según la guía de Expo: 'padding' en iOS; en Android basta con el componente.
        <KeyboardAvoidingView
          style={estilos.teclado}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {conPie}
        </KeyboardAvoidingView>
      ) : (
        conPie
      )}
      {flotante ? (
        <View style={estilos.flotante}>
          {typeof flotante === 'function' ? flotante(desplazada) : flotante}
        </View>
      ) : null}
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
  pie: {
    position: 'absolute',
    left: espacio.m,
    right: espacio.m,
    padding: espacio.s,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  marca: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  textosMarca: { flex: 1 },
  isotipo: { width: tamanoLogo.isotipo, aspectRatio: 1 },
  nombreApp: { color: colores.primario, fontFamily: fuentes.negrita },
  universidad: { color: colores.texto },
  encabezado: { gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  subtitulo: { color: colores.textoSecundario },
});
