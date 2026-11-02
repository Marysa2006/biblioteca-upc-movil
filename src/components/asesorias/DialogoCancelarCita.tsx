/**
 * Confirmación para cancelar una cita de asesoría (HU-14, CA3). Sin motivo: cancelarCita(id)
 * no lo recibe. Avisa que la franja queda libre para otra persona.
 * No guarda: Mis citas llama al hook con onConfirmar. Va en un Portal, fuera del
 * QueryClientProvider, así que no usa hooks de datos.
 */
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { AvisoError } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes } from '@/theme';
import type { Cita } from '@/types';
import { fechaCompleta } from '@/utils/calendario';

type Props = {
  /** El diálogo se muestra mientras no sea null. */
  cita: Cita | null;
  guardando: boolean;
  mensajeError: string | null;
  onConfirmar: (cita: Cita) => void;
  onCerrar: () => void;
};

export function DialogoCancelarCita({ cita, guardando, mensajeError, onConfirmar, onCerrar }: Props) {
  return (
    <Portal>
      <Dialog visible={cita != null} onDismiss={onCerrar} style={estilos.dialogo}>
        {/* View y no Fragment: Dialog le pasa un style a su primer hijo, y un Fragment no lo acepta. */}
        {cita ? (
          <View>
            <Dialog.Title style={estilos.titulo}>Cancelar la cita</Dialog.Title>
            <Dialog.Content style={estilos.contenido}>
              <Text variant="bodyMedium" style={estilos.texto}>
                {`¿Cancelar tu asesoría de ${cita.tema} del ${fechaCompleta(cita.fecha)}, ${cita.horaInicio} – ${cita.horaFin}?`}
              </Text>
              <Text variant="bodySmall" style={estilos.secundario}>
                La franja quedará libre para otra persona.
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
                accessibilityLabel="Volver sin cancelar la cita"
              >
                Volver
              </Button>
              <Button
                mode="contained"
                onPress={() => onConfirmar(cita)}
                loading={guardando}
                disabled={guardando}
                buttonColor={coloresEstado.rechazada.texto}
                contentStyle={estilos.contenidoBoton}
                accessibilityRole="button"
                accessibilityLabel={`Cancelar la asesoría de ${cita.tema}`}
              >
                Cancelar la cita
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
  secundario: { color: colores.textoSecundario },
  // Con letra grande, los botones pasan a otra línea en vez de cortarse.
  acciones: { flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
