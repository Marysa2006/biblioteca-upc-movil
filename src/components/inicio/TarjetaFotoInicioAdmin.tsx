/**
 * Foto de Inicio en Gestión → Portal → Fotos de Inicio (#290): la foto, si está publicada (con
 * texto, no solo color), su lugar en el carrusel y qué muestra. Editar, Subir, Bajar y Publicar u
 * Ocultar van en el menú de tres puntos (MenuAcciones).
 */
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { MenuAcciones, type AccionMenu } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { FotoInicio } from '@/types';
import { fuenteFotoInicio } from '@/utils/inicio';

type Props = {
  foto: FotoInicio;
  /** Su lugar entre las publicadas (1 es la primera), o null si está oculta. */
  lugar: number | null;
  totalPublicadas: number;
  /** true mientras se guarda un cambio de esta foto. */
  ocupado: boolean;
  onEditar: () => void;
  /** Sin la función, la acción no se ofrece (la primera no sube, la última no baja). */
  onSubir?: () => void;
  onBajar?: () => void;
  onCambiarPublicacion: () => void;
};

export function TarjetaFotoInicioAdmin({
  foto,
  lugar,
  totalPublicadas,
  ocupado,
  onEditar,
  onSubir,
  onBajar,
  onCambiarPublicacion,
}: Props) {
  const { publicada, descripcion } = foto;
  const fuente = fuenteFotoInicio(foto.imagen);
  const nombre = `la foto "${descripcion}"`;

  const acciones: AccionMenu[] = [
    { titulo: 'Editar', icono: 'pencil-outline', onPress: onEditar, etiqueta: `Editar ${nombre}` },
    ...(onSubir
      ? [{ titulo: 'Subir', icono: 'arrow-up', onPress: onSubir, etiqueta: `Subir ${nombre}` }]
      : []),
    ...(onBajar
      ? [{ titulo: 'Bajar', icono: 'arrow-down', onPress: onBajar, etiqueta: `Bajar ${nombre}` }]
      : []),
    {
      titulo: publicada ? 'Ocultar' : 'Publicar',
      icono: publicada ? 'eye-off-outline' : 'eye-outline',
      onPress: onCambiarPublicacion,
      etiqueta: `${publicada ? 'Ocultar' : 'Publicar'} ${nombre}`,
    },
  ];

  return (
    <View style={estilos.tarjeta}>
      {fuente ? (
        <Image
          source={fuente}
          style={estilos.foto}
          contentFit="cover"
          accessibilityLabel={descripcion}
        />
      ) : (
        <View style={[estilos.foto, estilos.sinFoto]}>
          <Icon source="image-off-outline" size={32} color={colores.textoSecundario} />
        </View>
      )}

      <View style={estilos.encabezado}>
        <View style={[estilos.estado, publicada ? estilos.estadoPublicada : estilos.estadoOculta]}>
          <Text
            variant="labelMedium"
            style={publicada ? estilos.textoPublicada : estilos.textoOculta}
          >
            {publicada ? 'Publicada' : 'Oculta'}
          </Text>
        </View>
        <MenuAcciones acciones={acciones} descripcion={`Acciones de ${nombre}`} ocupado={ocupado} />
      </View>

      <View style={estilos.textos}>
        <Text variant="bodyMedium" style={estilos.descripcion}>
          {descripcion}
        </Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          {lugar != null
            ? `Foto ${lugar} de ${totalPublicadas} en el carrusel de Inicio`
            : 'No se ve en Inicio'}
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  foto: { width: '100%', aspectRatio: 16 / 9, borderRadius: radio.boton },
  sinFoto: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.superficieVariante,
  },
  encabezado: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
  },
  estado: {
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs,
    borderRadius: radio.boton,
  },
  estadoPublicada: { backgroundColor: colores.primarioSuave },
  estadoOculta: { backgroundColor: coloresEstado.cancelada.fondo },
  textoPublicada: { color: colores.primarioOscuro, fontFamily: fuentes.seminegrita },
  textoOculta: { color: coloresEstado.cancelada.texto, fontFamily: fuentes.seminegrita },
  textos: { gap: espacio.xs },
  descripcion: { color: colores.texto },
  secundario: { color: colores.textoSecundario },
});
