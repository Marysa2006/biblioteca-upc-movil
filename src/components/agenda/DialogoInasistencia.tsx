/**
 * Confirmar que la persona no asistió a su cita (HU-15, CA3). No se puede deshacer desde la app,
 * por eso se pregunta antes. No guarda: el detalle llama al hook de la cita con onConfirmar.
 * Va en un Portal, fuera del QueryClientProvider: no usa hooks de datos.
 */
import { StyleSheet } from 'react-native';
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
  onConfirmar: () => void;
  onCerrar: () => void;
};

export function DialogoInasistencia({ cita, guardando, mensajeError, onConfirmar, onCerrar }: Props) {
  return (
    <Portal>
      <Dialog visible={cita != null} onDismiss={onCerrar} style={estilos.dialogo}>
        {cita ? (
          <>
            <Dialog.Title style={estilos.titulo}>Registrar inasistencia</Dialog.Title>
            <Dialog.Content style={estilos.contenido}>
              <Text variant="bodyMedium" style={estilos.texto}>
                {`¿Registrar que ${cita.solicitante} no asistió a la cita del ${fechaCompleta(cita.fecha).toLowerCase()}, ${cita.horaInicio}?`}
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
                accessibilityLabel="Volver sin registrar"
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
                accessibilityLabel={`Registrar que ${cita.solicitante} no asistió`}
              >
                No asistió
              </Button>
            </Dialog.Actions>
          </>
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
