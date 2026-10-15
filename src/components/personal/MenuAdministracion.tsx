/**
 * Menú "Administración" de la pestaña Personal (HU-04 y HU-28): una fila por función.
 * Toda la fila se puede presionar (TouchableRipple con su rol y su label).
 */
import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';

type Acceso = {
  titulo: string;
  descripcion: string;
  icono: string;
  /** Sin destino, la función todavía no existe: se muestra como próximamente. */
  destino?: Href;
};

const ACCESOS: Acceso[] = [
  {
    titulo: 'Contenidos del portal',
    descripcion: 'Servicios, avisos y novedades que ve la comunidad.',
    icono: 'file-document-edit-outline',
    destino: '/administracion/contenidos',
  },
  {
    titulo: 'Parámetros generales',
    descripcion: 'Periodos, festivos, horarios, tiempos mínimos y textos automáticos.',
    icono: 'tune-variant',
    destino: '/administracion/parametros',
  },
];

export function MenuAdministracion() {
  return (
    <View style={estilos.menu}>
      <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
        Administración
      </Text>
      {ACCESOS.map((acceso) => {
        const disponible = acceso.destino != null;
        return (
          <View key={acceso.titulo} style={estilos.fila}>
            <TouchableRipple
              onPress={disponible ? () => router.push(acceso.destino as Href) : undefined}
              disabled={!disponible}
              accessibilityRole="button"
              accessibilityState={{ disabled: !disponible }}
              accessibilityLabel={`${acceso.titulo}. ${acceso.descripcion}`}
            >
              <View style={estilos.contenido}>
                <View style={estilos.cuadroIcono}>
                  <Icon source={acceso.icono} size={24} color={colores.primario} />
                </View>
                <View style={estilos.textos}>
                  <Text variant="titleSmall" style={estilos.nombre}>
                    {acceso.titulo}
                  </Text>
                  <Text variant="bodySmall" style={estilos.descripcion}>
                    {acceso.descripcion}
                  </Text>
                </View>
                {disponible ? (
                  <Icon source="chevron-right" size={24} color={colores.textoSecundario} />
                ) : null}
              </View>
            </TouchableRipple>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  menu: { gap: espacio.s },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  fila: { borderRadius: radio.tarjeta, backgroundColor: colores.superficie, overflow: 'hidden' },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espacio.m, padding: espacio.m },
  cuadroIcono: {
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  textos: { flex: 1, gap: espacio.xs },
  nombre: { color: colores.texto, fontFamily: fuentes.seminegrita },
  descripcion: { color: colores.textoSecundario },
});
