/**
 * Rechazar una cita pendiente con su motivo (HU-15, #217). El motivo es obligatorio y llega a la
 * persona en la notificación; se valida antes de enviar y la API lo vuelve a validar.
 * No guarda: el detalle llama a useRechazarCita() con onConfirmar.
 * Va en un Portal, fuera del QueryClientProvider: no usa hooks de datos (regla 13).
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, Portal, Text, TextInput } from 'react-native-paper';

import { AvisoError } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes } from '@/theme';
import type { Cita } from '@/types';
import { esquemaRechazoCita, LARGO_MAXIMO_RECHAZO, type FormularioRechazoCita } from '@/utils/agenda';
import { fechaCompleta } from '@/utils/calendario';

type Props = {
  /** El diálogo se muestra mientras no sea null. */
  cita: Cita | null;
  accion?: 'rechazar' | 'cancelar';
  guardando: boolean;
  mensajeError: string | null;
  onConfirmar: (motivo: string) => void;
  onCerrar: () => void;
};

export function DialogoRechazarCita({ cita, accion = 'rechazar', guardando, mensajeError, onConfirmar, onCerrar }: Props) {
  return (
    <Portal>
      <Dialog visible={cita != null} onDismiss={guardando ? undefined : onCerrar} style={estilos.dialogo}>
        {/* key: al abrir el diálogo para otra cita, el motivo vuelve a empezar. */}
        {cita ? (
          <Contenido
            key={`${cita.id}-${accion}`}
            cita={cita}
            accion={accion}
            guardando={guardando}
            mensajeError={mensajeError}
            onConfirmar={onConfirmar}
            onCerrar={onCerrar}
          />
        ) : null}
      </Dialog>
    </Portal>
  );
}

function Contenido({ cita, accion, guardando, mensajeError, onConfirmar, onCerrar }: Props & { cita: Cita }) {
  const { control, handleSubmit } = useForm<FormularioRechazoCita>({
    resolver: zodResolver(esquemaRechazoCita),
    defaultValues: { motivo: '' },
  });

  const verbo = accion === 'cancelar' ? 'Cancelar' : 'Rechazar';

  // View y no Fragment: Dialog le pasa un style a su primer hijo, y un Fragment no lo acepta.
  return (
    <View>
      <Dialog.Title style={estilos.titulo}>{`${verbo} la cita`}</Dialog.Title>
      <Dialog.Content style={estilos.contenido}>
        <Text variant="bodyMedium" style={estilos.texto}>
          {`${cita.solicitante} · ${cita.tema} · ${fechaCompleta(cita.fecha)}, ${cita.horaInicio}`}
        </Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          El cupo queda libre para otra persona.
        </Text>
        <Controller
          control={control}
          name="motivo"
          render={({ field: { ref, value, onChange, onBlur }, fieldState: { error } }) => (
            <View>
              <TextInput
                ref={ref}
                mode="outlined"
                label="Motivo"
                placeholder="Por ejemplo: ese día no estaré en la biblioteca"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={error != null}
                disabled={guardando}
                multiline
                maxLength={LARGO_MAXIMO_RECHAZO}
                accessibilityLabel={`Motivo para ${verbo.toLowerCase()} la cita`}
              />
              <HelperText type="error" visible={error != null}>
                {error?.message}
              </HelperText>
            </View>
          )}
        />
        {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}
      </Dialog.Content>

      <Dialog.Actions style={estilos.acciones}>
        <Button
          mode="text"
          onPress={onCerrar}
          disabled={guardando}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel="Volver sin guardar"
        >
          Volver
        </Button>
        <Button
          mode="contained"
          onPress={() => handleSubmit(({ motivo }) => onConfirmar(motivo.trim()))()}
          loading={guardando}
          disabled={guardando}
          buttonColor={coloresEstado.rechazada.texto}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`${verbo} la cita de ${cita.solicitante}`}
        >
          {verbo}
        </Button>
      </Dialog.Actions>
    </View>
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
