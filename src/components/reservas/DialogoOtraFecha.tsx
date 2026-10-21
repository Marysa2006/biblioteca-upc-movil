/**
 * Diálogo para proponer otra fecha u horario a una reserva (HU-19, CA1 "modificar").
 * Valida los formatos y que el fin sea después del inicio; los choques de horario (CA3) y el
 * día no hábil (HU-28) los responde la API y se muestran en el aviso.
 * No guarda: la bandeja llama a useDecidirReserva() con onConfirmar.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, type Path } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, Portal, Text, TextInput } from 'react-native-paper';

import { AvisoError } from '@/components/ui';
import { colores, espacio, fuentes } from '@/theme';
import type { Reserva } from '@/types';
import { esquemaOtraFecha, type FormularioOtraFecha } from '@/utils/reservas';

type Props = {
  /** El diálogo se muestra mientras no sea null. */
  reserva: Reserva | null;
  guardando: boolean;
  mensajeError: string | null;
  onConfirmar: (datos: FormularioOtraFecha) => void;
  onCerrar: () => void;
};

export function DialogoOtraFecha({ reserva, guardando, mensajeError, onConfirmar, onCerrar }: Props) {
  return (
    <Portal>
      <Dialog visible={reserva != null} onDismiss={onCerrar} style={estilos.dialogo}>
        {reserva ? (
          // key: al abrir el diálogo para otra reserva, los campos vuelven a sus valores.
          <Contenido
            key={reserva.id}
            reserva={reserva}
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

type Campo = {
  nombre: Path<FormularioOtraFecha>;
  etiqueta: string;
  placeholder?: string;
  multilinea?: boolean;
};

const CAMPOS: Campo[] = [
  { nombre: 'fecha', etiqueta: 'Fecha (AAAA-MM-DD)', placeholder: '2026-10-27' },
  { nombre: 'horaInicio', etiqueta: 'Hora de inicio (HH:MM)', placeholder: '09:00' },
  { nombre: 'horaFin', etiqueta: 'Hora de fin (HH:MM)', placeholder: '11:00' },
  { nombre: 'motivo', etiqueta: 'Motivo (opcional)', multilinea: true },
];

function Contenido({
  reserva,
  guardando,
  mensajeError,
  onConfirmar,
  onCerrar,
}: Props & { reserva: Reserva }) {
  const { control, handleSubmit } = useForm<FormularioOtraFecha>({
    resolver: zodResolver(esquemaOtraFecha),
    defaultValues: {
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      motivo: '',
    },
  });

  return (
    <>
      <Dialog.Title style={estilos.titulo}>Proponer otra fecha</Dialog.Title>
      <Dialog.ScrollArea style={estilos.area}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <Text variant="bodyMedium" style={estilos.texto}>
            {`${reserva.solicitante} · ${reserva.proposito}`}
          </Text>
          {CAMPOS.map((campo) => (
            <Controller
              key={campo.nombre}
              control={control}
              name={campo.nombre}
              render={({ field: { ref, value, onChange, onBlur }, fieldState: { error } }) => (
                <View>
                  <TextInput
                    ref={ref}
                    mode="outlined"
                    label={campo.etiqueta}
                    placeholder={campo.placeholder}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={error != null}
                    disabled={guardando}
                    multiline={campo.multilinea}
                    keyboardType={campo.multilinea ? 'default' : 'numbers-and-punctuation'}
                    accessibilityLabel={campo.etiqueta}
                  />
                  <HelperText type="error" visible={error != null}>
                    {error?.message}
                  </HelperText>
                </View>
              )}
            />
          ))}
          {mensajeError ? <AvisoError mensaje={mensajeError} /> : null}
        </ScrollView>
      </Dialog.ScrollArea>

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
          onPress={handleSubmit(onConfirmar)}
          loading={guardando}
          disabled={guardando}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Proponer la nueva fecha a ${reserva.solicitante}`}
        >
          Proponer
        </Button>
      </Dialog.Actions>
    </>
  );
}

const estilos = StyleSheet.create({
  dialogo: { backgroundColor: colores.superficie, maxHeight: '90%' },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  area: { paddingHorizontal: 0 },
  contenido: { gap: espacio.xs, paddingHorizontal: espacio.l, paddingVertical: espacio.s },
  texto: { color: colores.texto, marginBottom: espacio.s },
  // Con letra grande, los botones pasan a otra línea en vez de cortarse.
  acciones: { flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
