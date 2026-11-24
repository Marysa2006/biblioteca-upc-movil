/**
 * Guía en Gestión → Portal → Guías (#258): formato (PDF, enlace o escrita), si está publicada,
 * título, descripción, el nombre y el tamaño del PDF (#303) y la fecha. Editar y Publicar o
 * Despublicar van en el menú de tres puntos. "Publicada" o "Sin publicar" va con texto, no solo
 * color.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { MenuAcciones, type AccionMenu } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { Guia } from '@/types';
import { fechaLegible } from '@/utils/fechas';
import { formatoDe, FORMATOS_GUIA, textoTamano } from '@/utils/guias';

type Props = {
  guia: Guia;
  /** true mientras se publica o despublica esta guía. */
  ocupado: boolean;
  onEditar: () => void;
  onCambiarPublicacion: () => void;
};

export function TarjetaGuiaAdmin({ guia, ocupado, onEditar, onCambiarPublicacion }: Props) {
  const { publicado, titulo } = guia;
  const formato = FORMATOS_GUIA[formatoDe(guia)];
  const accion = publicado ? 'Despublicar' : 'Publicar';

  const acciones: AccionMenu[] = [
    { titulo: 'Editar', icono: 'pencil-outline', onPress: onEditar, etiqueta: `Editar ${titulo}` },
    {
      titulo: accion,
      icono: publicado ? 'eye-off-outline' : 'eye-outline',
      onPress: onCambiarPublicacion,
      etiqueta: `${accion} ${titulo}`,
    },
  ];

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <View style={estilos.formato}>
          <Icon source={formato.icono} size={16} color={colores.primario} />
          <Text variant="labelMedium" style={estilos.textoFormato}>
            {formato.nombre}
          </Text>
        </View>
        <View style={estilos.derecha}>
          <View style={[estilos.estado, publicado ? estilos.estadoPublicada : estilos.estadoOculta]}>
            <Text
              variant="labelMedium"
              style={publicado ? estilos.textoPublicada : estilos.textoOculta}
            >
              {publicado ? 'Publicada' : 'Sin publicar'}
            </Text>
          </View>
          <MenuAcciones acciones={acciones} descripcion={`Acciones de ${titulo}`} ocupado={ocupado} />
        </View>
      </View>

      <View style={estilos.textos}>
        <Text variant="titleMedium" style={estilos.titulo}>
          {titulo}
        </Text>
        <Text variant="bodyMedium" style={estilos.secundario} numberOfLines={2}>
          {guia.descripcion}
        </Text>
        {guia.archivo ? (
          <Text variant="bodySmall" style={estilos.secundario} numberOfLines={1}>
            {`${guia.archivo.nombre} · ${textoTamano(guia.archivo.bytes)}`}
          </Text>
        ) : null}
        <Text variant="bodySmall" style={estilos.secundario}>
          {`Actualizada el ${fechaLegible(guia.actualizada.slice(0, 10))}`}
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
  encabezado: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
  },
  derecha: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  formato: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  textoFormato: { color: colores.primario },
  estado: {
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs,
    borderRadius: radio.boton,
  },
  estadoPublicada: { backgroundColor: colores.primarioSuave },
  estadoOculta: { backgroundColor: coloresEstado.cancelada.fondo },
  textoPublicada: { color: colores.primarioOscuro },
  textoOculta: { color: coloresEstado.cancelada.texto },
  textos: { gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  secundario: { color: colores.textoSecundario },
});
