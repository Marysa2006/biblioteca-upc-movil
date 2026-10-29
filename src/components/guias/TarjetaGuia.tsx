/**
 * Guía en la lista (HU-29): título, descripción, fecha y si está guardada en el celular,
 * con texto e ícono (CA2). Toda la tarjeta abre la guía.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { Guia } from '@/types';
import { fechaLegible } from '@/utils/fechas';
import type { EstadoGuia } from '@/utils/guias';

const MARCA: Record<EstadoGuia, { texto: string; icono: string; fondo: string; color: string }> = {
  guardada: {
    texto: 'Guardada · disponible sin conexión',
    icono: 'check-circle-outline',
    fondo: colores.primarioSuave,
    color: colores.primarioOscuro,
  },
  desactualizada: {
    texto: 'Guardando la versión nueva…',
    icono: 'sync',
    fondo: coloresEstado.nueva_fecha.fondo,
    color: coloresEstado.nueva_fecha.texto,
  },
  sin_guardar: {
    texto: 'Sin guardar · necesita internet',
    icono: 'cloud-download-outline',
    fondo: colores.superficieVariante,
    color: colores.textoSecundario,
  },
};

type Props = {
  guia: Guia;
  estado: EstadoGuia;
  onAbrir: () => void;
};

export function TarjetaGuia({ guia, estado, onAbrir }: Props) {
  const marca = MARCA[estado];
  return (
    <View style={estilos.tarjeta}>
      <TouchableRipple
        onPress={onAbrir}
        accessibilityRole="button"
        accessibilityLabel={`${guia.titulo}. ${guia.descripcion}. ${marca.texto}. Abrir guía`}
      >
        <View style={estilos.contenido}>
          <Text variant="titleMedium" style={estilos.titulo}>
            {guia.titulo}
          </Text>
          <Text variant="bodyMedium" style={estilos.descripcion}>
            {guia.descripcion}
          </Text>
          <View style={estilos.pie}>
            <View style={[estilos.marca, { backgroundColor: marca.fondo }]}>
              <Icon source={marca.icono} size={14} color={marca.color} />
              <Text variant="labelMedium" style={{ color: marca.color }}>
                {marca.texto}
              </Text>
            </View>
            <Text variant="bodySmall" style={estilos.descripcion}>
              {`Actualizada el ${fechaLegible(guia.actualizada)}`}
            </Text>
          </View>
        </View>
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { borderRadius: radio.tarjeta, backgroundColor: colores.superficie, overflow: 'hidden' },
  contenido: { gap: espacio.s, padding: espacio.m, minHeight: 44 },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  descripcion: { color: colores.textoSecundario },
  pie: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: espacio.s },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs,
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs,
    borderRadius: radio.boton,
  },
});
