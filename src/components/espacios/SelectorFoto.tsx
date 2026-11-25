/**
 * Fotografía de un espacio (HU-16): vista previa, elegir de la galería y quitar.
 * Revisa la foto antes de aceptarla y, si no sirve, pide corregirla (CA2).
 * Abrir la galería no necesita permiso (documentación de expo-image-picker, SDK 57).
 * También lo usan las fotos de Inicio (#290), con su propio aspecto (16:9) y su descripción.
 */
import { Image, type ImageProps } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText, Icon, Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import { FOTO, problemaFoto } from '@/utils/espacios';

type Props = {
  /** URI de la foto; vacío = sin foto. */
  valor: string;
  onCambiar: (uri: string) => void;
  deshabilitado?: boolean;
  /** Proporción del recorte y de la vista previa; por defecto 4:3, la de los espacios. */
  aspecto?: [number, number];
  /** Lo que dice el lector de pantalla de la vista previa. */
  descripcion?: string;
  /** Vista previa cuando `valor` no es una URI (las fotos que trae la app, #290). */
  fuente?: ImageProps['source'] | null;
};

export function SelectorFoto({
  valor,
  onCambiar,
  deshabilitado = false,
  aspecto = [4, 3],
  descripcion = 'Fotografía del espacio',
  fuente,
}: Props) {
  const proporcion = { aspectRatio: aspecto[0] / aspecto[1] };
  const [problema, setProblema] = useState<string | null>(null);

  const elegir = async () => {
    setProblema(null);
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: aspecto,
        quality: 0.7,
      });
      if (resultado.canceled) return;

      const foto = resultado.assets[0];
      const motivo = problemaFoto(foto);
      if (motivo) {
        setProblema(motivo);
        return;
      }
      onCambiar(foto.uri);
    } catch {
      setProblema('No pudimos abrir la galería. Inténtalo de nuevo.');
    }
  };

  const quitar = () => {
    setProblema(null);
    onCambiar('');
  };

  return (
    <View style={estilos.contenedor}>
      <Text variant="labelLarge" style={estilos.etiqueta}>
        Fotografía
      </Text>

      {valor ? (
        <Image
          source={fuente ?? { uri: valor }}
          style={[estilos.foto, proporcion]}
          contentFit="cover"
          accessibilityLabel={descripcion}
        />
      ) : (
        <View style={[estilos.sinFoto, proporcion]}>
          <Icon source="image-outline" size={40} color={colores.textoSecundario} />
          <Text variant="bodyMedium" style={estilos.textoSecundario}>
            Sin fotografía
          </Text>
        </View>
      )}

      <Text variant="bodySmall" style={estilos.textoSecundario}>
        {`JPG, PNG o WEBP, hasta ${FOTO.pesoMaximoMb} MB y de al menos ${FOTO.anchoMinimo} × ${FOTO.altoMinimo} px.`}
      </Text>

      <View style={estilos.acciones}>
        <Button
          mode="contained-tonal"
          icon="image-plus"
          onPress={elegir}
          disabled={deshabilitado}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={valor ? 'Cambiar la fotografía' : 'Elegir una fotografía de la galería'}
        >
          {valor ? 'Cambiar foto' : 'Elegir foto'}
        </Button>
        {valor ? (
          <Button
            mode="text"
            icon="close"
            onPress={quitar}
            disabled={deshabilitado}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Quitar la fotografía"
          >
            Quitar
          </Button>
        ) : null}
      </View>

      <HelperText type="error" visible={problema != null}>
        {problema}
      </HelperText>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { gap: espacio.s },
  etiqueta: { color: colores.texto, fontFamily: fuentes.seminegrita },
  foto: { width: '100%', aspectRatio: 4 / 3, borderRadius: radio.tarjeta },
  sinFoto: {
    width: '100%',
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.s,
    borderRadius: radio.tarjeta,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colores.bordeFuerte,
    backgroundColor: colores.superficieVariante,
  },
  textoSecundario: { color: colores.textoSecundario },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
