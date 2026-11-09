/**
 * Bloque de la orientación de autoarchivo (HU-11): título con su ícono y el contenido debajo.
 * Solo el bloque destacado va en tarjeta, para no repetir la misma caja en toda la pantalla.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';

type Props = {
  icono: string;
  titulo: string;
  /** En tarjeta blanca; los demás bloques van sobre el fondo. */
  destacado?: boolean;
  children: ReactNode;
};

export function BloqueOrientacion({ icono, titulo, destacado = false, children }: Props) {
  return (
    <View style={[estilos.bloque, destacado ? estilos.tarjeta : null]}>
      <View style={estilos.filaTitulo}>
        <Icon source={icono} size={22} color={colores.primario} />
        <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
          {titulo}
        </Text>
      </View>
      {children}
    </View>
  );
}

/** Lista con viñetas, en letra de lectura. */
export function ListaVinetas({ elementos }: { elementos: string[] }) {
  return (
    <View style={estilos.lista}>
      {elementos.map((texto, indice) => (
        <View key={indice} style={estilos.elemento} accessible accessibilityLabel={texto}>
          <Text variant="bodyLarge" style={estilos.vineta}>
            •
          </Text>
          <Text variant="bodyLarge" style={estilos.texto}>
            {texto}
          </Text>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  bloque: { gap: espacio.m },
  tarjeta: {
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  titulo: { flex: 1, color: colores.texto, fontFamily: fuentes.seminegrita },
  lista: { gap: espacio.s },
  elemento: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.s },
  vineta: { color: colores.primario },
  texto: { flex: 1, color: colores.texto },
});
