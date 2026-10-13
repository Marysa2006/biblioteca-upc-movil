/**
 * Tarjeta de una base de datos o recurso académico (HU-03).
 * Toda la tarjeta se puede presionar; la pantalla decide si lo abre o pide iniciar sesión.
 *
 * Usa TouchableRipple y no Card con onPress: Card pasa accessibilityRole y accessibilityLabel
 * a su contenedor exterior, no al elemento que se presiona.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { Recurso } from '@/types';

type Props = {
  recurso: Recurso;
  onPress: () => void;
};

export function TarjetaRecurso({ recurso, onPress }: Props) {
  const etiquetaCuenta = recurso.requiereCuenta ? 'Requiere cuenta institucional. ' : '';

  return (
    <View style={estilos.tarjeta}>
      <TouchableRipple
        onPress={onPress}
        accessibilityRole="link"
        accessibilityLabel={`${recurso.nombre}. ${etiquetaCuenta}Abre en el navegador`}
      >
        <View style={estilos.contenido}>
          <View
            style={estilos.cuadroIcono}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Icon source="database-search-outline" size={24} color={colores.primario} />
          </View>
          <View style={estilos.textos}>
            <Text variant="titleMedium" style={estilos.nombre}>
              {recurso.nombre}
            </Text>
            <Text variant="bodyMedium" style={estilos.descripcion} numberOfLines={2}>
              {recurso.descripcion}
            </Text>
            {recurso.requiereCuenta ? (
              <View style={estilos.cuenta}>
                <Icon source="lock-outline" size={16} color={colores.textoSecundario} />
                <Text variant="bodySmall" style={estilos.textoCuenta}>
                  Requiere cuenta institucional
                </Text>
              </View>
            ) : null}
          </View>
          <Icon source="open-in-new" size={20} color={colores.textoSecundario} />
        </View>
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  tarjeta: { backgroundColor: colores.superficie, borderRadius: radio.tarjeta, overflow: 'hidden' },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espacio.m, padding: espacio.m },
  cuadroIcono: {
    alignSelf: 'flex-start',
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  textos: { flex: 1, gap: espacio.xs },
  nombre: { color: colores.texto, fontFamily: fuentes.negrita },
  descripcion: { color: colores.textoSecundario },
  cuenta: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  textoCuenta: { flex: 1, color: colores.textoSecundario },
});
