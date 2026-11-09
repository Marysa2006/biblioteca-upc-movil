/**
 * Buscar una tablet por su código (HU-31): se abre con el ícono del encabezado de Préstamos.
 * Ofrece abrir el escáner (CA1) o escribir el código a mano, sin cámara, sin permiso o con la
 * etiqueta dañada (CA3). Si el código escrito no sirve, el aviso sale aquí mismo (CA2).
 *
 * Va en un Portal, fuera del QueryClientProvider y de la navegación: no usa hooks de datos ni
 * la cámara. La sección busca la tablet y abre la cámara de la app, si hace falta.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text, TextInput } from 'react-native-paper';

import { AvisoError } from '@/components/ui';
import { colores, espacio, fuentes } from '@/theme';

type Props = {
  visible: boolean;
  buscando: boolean;
  /** El código no es del inventario o la tablet no tiene préstamos activos. */
  mensaje: string | null;
  onEscanear: () => void;
  onBuscar: (codigo: string) => void;
  onCerrar: () => void;
};

export function DialogoBuscarTablet({
  visible,
  buscando,
  mensaje,
  onEscanear,
  onBuscar,
  onCerrar,
}: Props) {
  const [codigo, setCodigo] = useState('');
  const limpio = codigo.trim();

  const buscar = () => {
    if (limpio) onBuscar(limpio);
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCerrar} style={estilos.dialogo}>
        {/* View y no Fragment: Dialog le pasa un style a su primer hijo, y un Fragment no lo acepta. */}
        <View>
          <Dialog.Title style={estilos.titulo}>Buscar una tablet</Dialog.Title>
          <Dialog.Content style={estilos.contenido}>
            <Text variant="bodyMedium" style={estilos.texto}>
              Lee el código de la etiqueta y se abre su entrega o su devolución.
            </Text>
            <Button
              mode="contained"
              icon="barcode-scan"
              onPress={onEscanear}
              disabled={buscando}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel="Abrir el escáner para leer el código de la tablet"
            >
              Abrir escáner
            </Button>

            <Text variant="labelLarge" style={estilos.separador}>
              O escribe el código
            </Text>
            <TextInput
              mode="outlined"
              label="Código de la tablet"
              placeholder="Por ejemplo: TAB-001"
              value={codigo}
              onChangeText={setCodigo}
              onSubmitEditing={buscar}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              disabled={buscando}
              accessibilityLabel="Escribir el código de la tablet"
            />
            {mensaje ? <AvisoError mensaje={mensaje} /> : null}
          </Dialog.Content>

          <Dialog.Actions style={estilos.acciones}>
            <Button
              mode="text"
              onPress={onCerrar}
              disabled={buscando}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel="Cerrar sin buscar"
            >
              Cancelar
            </Button>
            <Button
              mode="contained-tonal"
              onPress={buscar}
              loading={buscando}
              disabled={buscando || limpio === ''}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel="Buscar la tablet con el código escrito"
            >
              Buscar
            </Button>
          </Dialog.Actions>
        </View>
      </Dialog>
    </Portal>
  );
}

const estilos = StyleSheet.create({
  dialogo: { backgroundColor: colores.superficie },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  contenido: { gap: espacio.s },
  texto: { color: colores.texto },
  separador: {
    marginTop: espacio.s,
    color: colores.textoSecundario,
    fontFamily: fuentes.seminegrita,
  },
  // Con letra grande, los botones pasan a otra línea en vez de cortarse.
  acciones: { flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
