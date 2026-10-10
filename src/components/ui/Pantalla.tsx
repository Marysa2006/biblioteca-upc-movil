import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colores, espacio } from '@/theme';
import { NOMBRE_APP } from '@/utils/constantes';

type Props = {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
};

/** Contenedor común de las pantallas: área segura, marca, título y contenido desplazable. */
export function Pantalla({ titulo, subtitulo, children }: Props) {
  return (
    <SafeAreaView style={estilos.area} edges={['top']}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <Text variant="labelLarge" style={estilos.marca}>
          {NOMBRE_APP}
        </Text>
        <View style={estilos.encabezado}>
          <Text variant="headlineSmall" style={estilos.titulo}>
            {titulo}
          </Text>
          {subtitulo ? (
            <Text variant="bodyMedium" style={estilos.subtitulo}>
              {subtitulo}
            </Text>
          ) : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: colores.fondo },
  contenido: { padding: espacio.m, gap: espacio.m, paddingBottom: espacio.xl },
  marca: { color: colores.primario, fontWeight: '700' },
  encabezado: { gap: espacio.xs },
  titulo: { color: colores.texto, fontWeight: '700' },
  subtitulo: { color: colores.textoSecundario },
});
