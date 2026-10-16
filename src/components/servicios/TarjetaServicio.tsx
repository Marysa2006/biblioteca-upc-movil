/**
 * Tarjeta de un servicio en la pestaña Servicios (HU-01): ícono, nombre y descripción corta.
 * La categoría no se repite: ya va como título de la sección; el lector de pantalla sí la nombra.
 * Toda la tarjeta se puede presionar y abre el detalle.
 *
 * Usa TouchableRipple y no Card con onPress: Card pasa accessibilityRole y accessibilityLabel
 * a su contenedor exterior, no al elemento que se presiona.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fondoServicio, fuentes, radio } from '@/theme';
import type { Servicio } from '@/types';
import { CATEGORIAS_SERVICIO } from '@/utils/servicios';

import { IconoCategoria } from './IconoCategoria';

type Props = {
  servicio: Servicio;
  onPress: () => void;
};

export function TarjetaServicio({ servicio, onPress }: Props) {
  const nombreCategoria = CATEGORIAS_SERVICIO[servicio.categoria].nombre;

  return (
    <View style={[estilos.tarjeta, { backgroundColor: fondoServicio[servicio.categoria] }]}>
      <TouchableRipple
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${servicio.nombre}, ${nombreCategoria}. Ver detalle`}
      >
        <View style={estilos.contenido}>
          <View style={estilos.textos}>
            <View style={estilos.filaNombre}>
              <IconoCategoria categoria={servicio.categoria} tamano={20} />
              <Text variant="titleMedium" style={estilos.nombre}>
                {servicio.nombre}
              </Text>
            </View>
            <Text variant="bodyMedium" style={estilos.descripcion} numberOfLines={2}>
              {servicio.descripcion}
            </Text>
            {servicio.requiereCuenta ? (
              <Text variant="bodySmall" style={estilos.textoCuenta}>
                Requiere cuenta institucional
              </Text>
            ) : null}
          </View>
          <Icon source="chevron-right" size={24} color={colores.textoSecundario} />
        </View>
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  tarjeta: { borderRadius: radio.tarjeta, overflow: 'hidden' },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espacio.m, padding: espacio.m },
  textos: { flex: 1, gap: espacio.xs },
  // El ícono va al inicio del nombre; el resto del texto usa todo el ancho de la tarjeta.
  filaNombre: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  nombre: { flex: 1, color: colores.texto, fontFamily: fuentes.negrita },
  descripcion: { color: colores.textoSecundario },
  textoCuenta: { color: colores.textoSecundario },
});
