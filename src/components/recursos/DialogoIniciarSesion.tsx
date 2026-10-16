/**
 * Diálogo que pide iniciar sesión para abrir un recurso con cuenta institucional (HU-03, CA3).
 * Se muestra mientras `recurso` no sea null. No navega: la pantalla decide qué hace "Iniciar sesión".
 */
import { StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';
import type { Recurso } from '@/types';

type Props = {
  recurso: Recurso | null;
  onIniciarSesion: () => void;
  /** También se llama al tocar fuera del diálogo o con el botón atrás de Android. */
  onCerrar: () => void;
};

export function DialogoIniciarSesion({ recurso, onIniciarSesion, onCerrar }: Props) {
  return (
    <Portal>
      <Dialog visible={recurso != null} onDismiss={onCerrar} style={estilos.dialogo}>
        <Dialog.Icon icon="lock-outline" color={colores.primario} />
        <Dialog.Title style={estilos.titulo}>Inicia sesión para continuar</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={estilos.texto}>
            {`${recurso?.nombre ?? 'Este recurso'} requiere tu cuenta institucional. Inicia sesión para abrirlo.`}
          </Text>
        </Dialog.Content>
        <Dialog.Actions style={estilos.acciones}>
          <Button
            mode="text"
            onPress={onCerrar}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Ahora no"
          >
            Ahora no
          </Button>
          <Button
            mode="contained"
            icon="login"
            onPress={onIniciarSesion}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Iniciar sesión"
          >
            Iniciar sesión
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const estilos = StyleSheet.create({
  dialogo: { backgroundColor: colores.superficie },
  titulo: { textAlign: 'center', color: colores.texto, fontFamily: fuentes.negrita },
  texto: { color: colores.texto },
  // Con letra grande, los botones pasan a otra línea en vez de cortarse.
  acciones: { flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
