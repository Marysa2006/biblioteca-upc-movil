/**
 * Tarjeta de un servicio en la pestaña Servicios (HU-01): ícono, nombre, categoría y descripción corta.
 * Toda la tarjeta se puede presionar y abre el detalle.
 */
import { StyleSheet, View } from 'react-native';
import { Card, Icon, Text } from 'react-native-paper';

import { acentoServicio, colores, espacio, fuentes, radio } from '@/theme';
import type { Servicio } from '@/types';
import { CATEGORIAS_SERVICIO } from '@/utils/servicios';

import { IconoCategoria } from './IconoCategoria';

type Props = {
  servicio: Servicio;
  onPress: () => void;
};

export function TarjetaServicio({ servicio, onPress }: Props) {
  const acento = acentoServicio[servicio.categoria];
  const nombreCategoria = CATEGORIAS_SERVICIO[servicio.categoria].nombre;

  return (
    <Card
      mode="contained"
      onPress={onPress}
      style={estilos.tarjeta}
      accessibilityRole="button"
      accessibilityLabel={`${servicio.nombre}, ${nombreCategoria}. Ver detalle`}
    >
      <Card.Content style={estilos.contenido}>
        <IconoCategoria categoria={servicio.categoria} tamano={24} />
        <View style={estilos.textos}>
          <Text variant="titleMedium" style={estilos.nombre}>
            {servicio.nombre}
          </Text>
          <Text variant="labelMedium" style={{ color: acento }}>
            {nombreCategoria}
          </Text>
          <Text variant="bodyMedium" style={estilos.descripcion} numberOfLines={2}>
            {servicio.descripcion}
          </Text>
          {servicio.requiereCuenta ? (
            <View style={estilos.cuenta}>
              <Icon source="account-lock-outline" size={16} color={colores.textoSecundario} />
              <Text variant="bodySmall" style={estilos.textoCuenta}>
                Requiere cuenta institucional
              </Text>
            </View>
          ) : null}
        </View>
        <Icon source="chevron-right" size={24} color={colores.textoSecundario} />
      </Card.Content>
    </Card>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: colores.superficie, borderRadius: radio.tarjeta },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espacio.m },
  textos: { flex: 1, gap: espacio.xs },
  nombre: { color: colores.texto, fontFamily: fuentes.negrita },
  descripcion: { color: colores.textoSecundario },
  cuenta: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  textoCuenta: { flex: 1, color: colores.textoSecundario },
});
