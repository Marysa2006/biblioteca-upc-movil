/**
 * Ventana con un texto largo que se desplaza (revisión de la 1.1): la autorización de datos en el
 * Login y el Registro, y las condiciones del préstamo de tablets. Así el texto no alarga la pantalla.
 * Con `aceptar`, el botón principal acepta (por ejemplo, marca la casilla) y cierra; sin él, solo
 * se cierra. Va en un Portal: no usa hooks de datos, recibe el contenido por `children`.
 */
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Dialog, Portal } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';

type Props = {
  visible: boolean;
  titulo: string;
  children: ReactNode;
  onCerrar: () => void;
  /** Botón principal, por ejemplo «Acepto»: hace su acción y cierra la ventana. */
  aceptar?: { texto: string; onPress: () => void };
};

export function DialogoTexto({ visible, titulo, children, onCerrar, aceptar }: Props) {
  const { height } = useWindowDimensions();
  // El texto ocupa más de la mitad de la pantalla, pero deja ver los botones.
  const altoTexto = Math.round(height * 0.55);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCerrar} style={estilos.dialogo}>
        {/* View y no Fragment: Dialog le pasa un style a su primer hijo. */}
        <View>
          <Dialog.Title style={estilos.titulo}>{titulo}</Dialog.Title>
          <Dialog.ScrollArea style={[estilos.area, { maxHeight: altoTexto }]}>
            <ScrollView contentContainerStyle={estilos.contenido}>{children}</ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions style={estilos.acciones}>
            <Button
              mode={aceptar ? 'text' : 'contained-tonal'}
              onPress={onCerrar}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel={`Cerrar ${titulo}`}
            >
              Cerrar
            </Button>
            {aceptar ? (
              <Button
                mode="contained"
                onPress={() => {
                  aceptar.onPress();
                  onCerrar();
                }}
                contentStyle={estilos.contenidoBoton}
                accessibilityRole="button"
                accessibilityLabel={`${aceptar.texto}: ${titulo}`}
              >
                {aceptar.texto}
              </Button>
            ) : null}
          </Dialog.Actions>
        </View>
      </Dialog>
    </Portal>
  );
}

const estilos = StyleSheet.create({
  dialogo: { backgroundColor: colores.superficie },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  area: { paddingHorizontal: 0, borderColor: colores.borde },
  contenido: { gap: espacio.s, paddingHorizontal: espacio.l, paddingVertical: espacio.m },
  // Con letra grande, los botones pasan a otra línea en vez de cortarse.
  acciones: { flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
