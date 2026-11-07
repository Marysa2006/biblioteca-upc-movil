/**
 * Confirmación para no aceptar la nueva fecha de una capacitación (HU-12, CA4). Según la API
 * (responderNuevaFecha con acepta: false), la solicitud queda Cancelada; si la persona necesita
 * otra fecha, hace una solicitud nueva.
 * No guarda: el detalle de Mis solicitudes llama al hook con onConfirmar. Va en un Portal,
 * fuera del QueryClientProvider, así que no usa hooks de datos.
 */
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { AvisoError } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes } from '@/theme';
import type { SolicitudCapacitacion } from '@/types';

type Props = {
  /** El diálogo se muestra mientras no sea null. */
  solicitud: SolicitudCapacitacion | null;
  /** La fecha propuesta ya escrita para leer ("Lunes 9 de noviembre a las 10:00"). */
  propuesta: string | null;
  guardando: boolean;
  mensajeError: string | null;
  onConfirmar: () => void;
  onCerrar: () => void;
};

export function DialogoNoMeSirve({
  solicitud,
  propuesta,
  guardando,
  mensajeError,
  onConfirmar,
  onCerrar,
}: Props) {
  return (
    <Portal>
      <Dialog visible={solicitud != null} onDismiss={onCerrar} style={estilos.dialogo}>
        {/* View y no Fragment: Dialog le pasa un style a su primer hijo, y un Fragment no lo acepta. */}
        {solicitud ? (
          <View>
            <Dialog.Title style={estilos.titulo}>¿No te sirve la nueva fecha?</Dialog.Title>
            <Dialog.Content style={estilos.contenido}>
              <Text variant="bodyMedium" style={estilos.texto}>
                {propuesta
                  ? `La biblioteca propuso la capacitación de ${solicitud.linea} para el ${propuesta}.`
                  : `La biblioteca propuso otra fecha para la capacitación de ${solicitud.linea}.`}
              </Text>
              <Text variant="bodyMedium" style={estilos.texto}>
                Si no la aceptas, la solicitud quedará cancelada. Si necesitas otra fecha, haz una
                solicitud nueva.
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
                accessibilityLabel="Volver sin responder"
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
                accessibilityLabel={`No aceptar la nueva fecha y cancelar la capacitación de ${solicitud.linea}`}
              >
                Cancelar la solicitud
              </Button>
            </Dialog.Actions>
          </View>
        ) : null}
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
