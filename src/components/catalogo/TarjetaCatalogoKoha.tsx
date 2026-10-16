/**
 * Acceso al catálogo en línea de Koha (HU-02).
 * Solo muestra: el estado y la acción de abrir llegan por props desde la pantalla,
 * que usa useCatalogoKoha().
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Card, Icon, Text, TextInput } from 'react-native-paper';

import { AvisoError } from '@/components/ui';
import type { EstadoCatalogo } from '@/hooks/useCatalogoKoha';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';

const MENSAJE_NO_DISPONIBLE = 'El catálogo no está disponible en este momento. Intenta más tarde.';

type Props = {
  estado: EstadoCatalogo;
  /** Abre la búsqueda de Koha si hay texto, o su página principal si está vacío. */
  onAbrir: (busqueda: string) => void;
};

export function TarjetaCatalogoKoha({ estado, onAbrir }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const comprobando = estado === 'comprobando';
  const texto = busqueda.trim();
  const abrir = () => onAbrir(busqueda);

  // accessibilityLiveRegion solo funciona en Android; en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && estado === 'no_disponible') {
      AccessibilityInfo.announceForAccessibility(MENSAJE_NO_DISPONIBLE);
    }
  }, [estado]);

  return (
    <Card mode="contained" style={estilos.tarjeta}>
      <Card.Content style={estilos.contenido}>
        <View style={estilos.encabezado}>
          <View style={estilos.cuadroIcono}>
            <Icon source="bookshelf" size={28} color={colores.primario} />
          </View>
          <View style={estilos.textos}>
            <Text variant="titleMedium" style={estilos.titulo} accessibilityRole="header">
              Catálogo en línea
            </Text>
            <Text variant="bodyMedium" style={estilos.descripcion}>
              Libros, revistas, tesis y demás material de la biblioteca, en Koha.
            </Text>
          </View>
        </View>

        <TextInput
          mode="outlined"
          label="Buscar en el catálogo"
          accessibilityLabel="Buscar en el catálogo"
          value={busqueda}
          onChangeText={setBusqueda}
          onSubmitEditing={abrir}
          returnKeyType="search"
          // Decorativo: sin esto, el lector lo anuncia como un botón sin nombre.
          left={<TextInput.Icon icon="magnify" accessible={false} importantForAccessibility="no" />}
          disabled={comprobando}
        />

        {estado === 'no_disponible' ? (
          <AvisoError mensaje={MENSAJE_NO_DISPONIBLE}>
            <Button
              mode="outlined"
              icon="refresh"
              onPress={abrir}
              textColor={coloresEstado.rechazada.texto}
              style={estilos.botonReintentar}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel="Reintentar abrir el catálogo"
            >
              Reintentar
            </Button>
          </AvisoError>
        ) : (
          <Button
            mode="contained"
            icon="open-in-new"
            onPress={abrir}
            loading={comprobando}
            disabled={comprobando}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel={
              texto !== '' ? `Buscar «${texto}» en el catálogo` : 'Abrir catálogo'
            }
          >
            Abrir catálogo
          </Button>
        )}

        <Text variant="bodySmall" style={estilos.nota}>
          Se abre en el navegador; al cerrarlo vuelves aquí.
        </Text>
      </Card.Content>
    </Card>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { backgroundColor: colores.superficie, borderRadius: radio.tarjeta },
  contenido: { gap: espacio.m },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.m },
  cuadroIcono: {
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  textos: { flex: 1, gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  descripcion: { color: colores.textoSecundario },
  botonReintentar: { borderColor: coloresEstado.rechazada.texto },
  contenidoBoton: { paddingVertical: espacio.xs },
  nota: { color: colores.textoSecundario },
});
