/**
 * Confirmar el cierre de la asistencia (HU-33, CA4): después, el QR deja de aceptar registros y
 * no se puede volver a abrir. No guarda: la pantalla llama al hook con onConfirmar.
 * Va en un Portal, fuera del QueryClientProvider: no usa hooks de datos.
 */
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { AvisoError } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes } from '@/theme';

type Props = {
  visible: boolean;
  total: number;
  guardando: boolean;
  mensajeError: string | null;
  onConfirmar: () => void;
  onCerrar: () => void;
};

export function DialogoCerrarAsistencia({
  visible,
  total,
  guardando,
  mensajeError,
  onConfirmar,
  onCerrar,
}: Props) {
  const asistentes = total === 1 ? '1 asistente' : `${total} asistentes`;
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCerrar} style={estilos.dialogo}>
        {/* View y no Fragment: Dialog le pasa un style a su primer hijo, y un Fragment no lo acepta. */}
        <View>
          <Dialog.Title style={estilos.titulo}>Cerrar la asistencia</Dialog.Title>
          <Dialog.Content style={estilos.contenido}>
            <Text variant="bodyMedium" style={estilos.texto}>
              {`Quedan registrados ${asistentes}. El QR dejará de aceptar registros y no se podrá volver a abrir.`}
            </Text>
            {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}
          </Dialog.Content>

          <Dialog.Actions style={estilos.acciones}>
            <Button
              mode="text"
              onPress={onCerrar}
              disabled={guardando}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel="Volver sin cerrar la asistencia"
            >
              Volver
            </Button>
            <Button
              mode="contained"
              onPress={onConfirmar}
              loading={guardando}
              disabled={guardando}
              buttonColor={coloresEstado.rechazada.texto}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel={`Cerrar la asistencia con ${asistentes}`}
            >
              Cerrar asistencia
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
  // Con letra grande, los botones pasan a otra línea en vez de cortarse.
  acciones: { flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
