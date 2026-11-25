/**
 * Diálogo para rechazar o cancelar una reserva con su motivo (HU-19, CA2).
 * El motivo es obligatorio: se valida antes de enviar y la API lo vuelve a validar.
 * No guarda: la bandeja llama a useDecidirReserva() con onConfirmar.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, Portal, Text, TextInput } from 'react-native-paper';

import { AvisoError } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes } from '@/theme';
import type { Reserva } from '@/types';
import { fechaLegible } from '@/utils/fechas';
import { esquemaMotivo, type FormularioMotivo } from '@/utils/reservas';

export type SolicitudMotivo = { reserva: Reserva; accion: 'rechazar' | 'cancelar' };

type Props = {
  /** El diálogo se muestra mientras no sea null. */
  solicitud: SolicitudMotivo | null;
  guardando: boolean;
  mensajeError: string | null;
  onConfirmar: (motivo: string) => void;
  onCerrar: () => void;
};

export function DialogoMotivo({ solicitud, ...props }: Props) {
  const reserva = solicitud?.reserva;
  const verbo = solicitud?.accion === 'rechazar' ? 'Rechazar' : 'Cancelar';
  return (
    <DialogoMotivoAccion
      {...props}
      accion={reserva ? {
        id: reserva.id,
        titulo: `${verbo} la reserva`,
        detalle: `${reserva.solicitante} · ${fechaLegible(reserva.fecha)}, ${reserva.horaInicio} – ${reserva.horaFin}`,
        boton: verbo,
      } : null}
    />
  );
}

type AccionMotivo = { id: string; titulo: string; detalle: string; boton: string };
type PropsAccion = Omit<Props, 'solicitud'> & { accion: AccionMotivo | null };

export function DialogoMotivoAccion({ accion, ...props }: PropsAccion) {
  return (
    <Portal>
      <Dialog visible={accion != null} onDismiss={props.guardando ? undefined : props.onCerrar} style={estilos.dialogo}>
        {accion ? <Contenido key={`${accion.id}-${accion.titulo}`} accion={accion} {...props} /> : null}
      </Dialog>
    </Portal>
  );
}
function Contenido({
  accion,
  guardando,
  mensajeError,
  onConfirmar,
  onCerrar,
}: PropsAccion & { accion: AccionMotivo }) {
  const { control, handleSubmit } = useForm<FormularioMotivo>({
    resolver: zodResolver(esquemaMotivo),
    defaultValues: { motivo: '' },
  });

  return (
    <>
      <Dialog.Title style={estilos.titulo}>{accion.titulo}</Dialog.Title>
      <Dialog.Content style={estilos.contenido}>
        <Text variant="bodyMedium" style={estilos.texto}>
          {accion.detalle}
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

                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={error != null}
                disabled={guardando}
                multiline
                accessibilityLabel="Motivo"
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
          onPress={() => handleSubmit(({ motivo }) => onConfirmar(motivo))()}
          loading={guardando}
          disabled={guardando}
          buttonColor={coloresEstado.rechazada.texto}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={accion.titulo}
        >
          {accion.boton}
        </Button>
      </Dialog.Actions>
    </>
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
