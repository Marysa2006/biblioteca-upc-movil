/**
 * Acceso a las guías de la biblioteca desde la pestaña Servicios (HU-29). Va arriba y fuera de
 * la lista de servicios para que se pueda abrir aunque no haya conexión: las guías guardadas
 * se leen igual.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';

export function AccesoGuias() {
  return (
    <View style={estilos.tarjeta}>
      <TouchableRipple
        onPress={() => router.push('/guias')}
        accessibilityRole="button"
        accessibilityLabel="Guías de la biblioteca. Disponibles sin conexión: guárdalas en tu celular y léelas sin internet."
      >
        <View style={estilos.contenido}>
          <View style={estilos.icono}>
            <Icon source="book-open-page-variant-outline" size={24} color={colores.primario} />
          </View>
          <View style={estilos.textos}>
            <Text variant="titleSmall" style={estilos.titulo}>
              Guías de la biblioteca
            </Text>
            <View style={estilos.marca}>
              <Icon source="cloud-off-outline" size={14} color={colores.primarioOscuro} />
              <Text variant="labelMedium" style={estilos.textoMarca}>
                Disponible sin conexión
              </Text>
            </View>
            <Text variant="bodySmall" style={estilos.descripcion}>
              APA, Mendeley y el catálogo, para leer aunque no tengas señal.
            </Text>
          </View>
          <Icon source="chevron-right" size={24} color={colores.textoSecundario} />
        </View>
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  tarjeta: { borderRadius: radio.tarjeta, backgroundColor: colores.superficie, overflow: 'hidden' },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espacio.m, padding: espacio.m },
  icono: { padding: espacio.s, borderRadius: radio.boton, backgroundColor: colores.primarioSuave },
  textos: { flex: 1, gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: espacio.xs,
    paddingHorizontal: espacio.s,
    paddingVertical: 2,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  textoMarca: { color: colores.primarioOscuro },
  descripcion: { color: colores.textoSecundario },
});
