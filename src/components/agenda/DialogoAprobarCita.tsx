/**
 * Aprobar una cita pendiente (HU-15, #250): quién la atiende, la fecha y la hora (prellenadas con
 * las que pidió la persona) y, si es virtual, el enlace para entrar.
 * - La administración elige el facilitador; el facilitador se la asigna a sí mismo (CA1 y CA2).
 * - Una cita virtual no se aprueba sin un enlace https: el error va bajo el campo (CA3).
 * No guarda: el detalle llama a useAprobarCita() con onConfirmar.
 * Va en un Portal, fuera del QueryClientProvider: el detalle consulta el equipo y los parámetros
 * y se los pasa por props (regla 13).
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, Portal, RadioButton, Text, TextInput } from 'react-native-paper';

import { CampoFormulario } from '@/components/reservas/CampoFormulario';
import { AvisoError, EstadoCarga, EstadoError, EstadoVacio } from '@/components/ui';
import type { CitaAgenda } from '@/hooks/useAsesorias';
import { colores, espacio, fuentes } from '@/theme';
import type { Parametros } from '@/types';
import { esquemaAprobacionCita, type FormularioAprobacionCita } from '@/utils/agenda';
import { fechaCompleta, sumarMeses } from '@/utils/calendario';
import { hoyISO } from '@/utils/fechas';
import { motivoDiaReserva } from '@/utils/reservas';

/** Hasta cuántos meses adelante se puede mover la cita al aprobarla. */
const MESES_APROBACION = 3;

export type OpcionFacilitador = { id: string; nombre: string };

type Props = {
  /** El diálogo se muestra mientras no sea null. */
  cita: CitaAgenda | null;
  /** La administración elige entre los facilitadores; el facilitador se asigna a sí mismo. */
  eligeFacilitador: boolean;
  /** Quien aprueba: es el facilitador cuando no elige. */
  yo: OpcionFacilitador;
  /** Los facilitadores, solo cuando eligeFacilitador; null mientras cargan o si fallaron. */
  facilitadores: OpcionFacilitador[] | null;
  cargandoFacilitadores: boolean;
  onReintentarFacilitadores: () => void;
  /** Para tachar los días no hábiles; mientras cargan, solo se bloquean los pasados. */
  parametros?: Parametros;
  guardando: boolean;
  mensajeError: string | null;
  onConfirmar: (datos: FormularioAprobacionCita) => void;
  onCerrar: () => void;
};

export function DialogoAprobarCita({ cita, ...props }: Props) {
  return (
    <Portal>
      <Dialog visible={cita != null} onDismiss={props.onCerrar} style={estilos.dialogo}>
        {/* key: al abrirlo para otra cita, los campos vuelven a lo que pidió la persona. */}
        {cita ? <Contenido key={cita.id} cita={cita} {...props} /> : null}
      </Dialog>
    </Portal>
  );
}

function Contenido({
  cita,
  eligeFacilitador,
  yo,
  facilitadores,
  cargandoFacilitadores,
  onReintentarFacilitadores,
  parametros,
  guardando,
  mensajeError,
  onConfirmar,
  onCerrar,
}: Props & { cita: CitaAgenda }) {
  const [hoy] = useState(hoyISO);
  const virtual = cita.modalidad === 'virtual';
  const { control, handleSubmit } = useForm<FormularioAprobacionCita>({
    resolver: zodResolver(esquemaAprobacionCita(virtual)),
    defaultValues: {
      // La administración elige; el facilitador queda asignado a sí mismo.
      facilitadorId: eligeFacilitador ? (cita.facilitadorId ?? '') : yo.id,
      fecha: cita.fecha,
      hora: cita.horaInicio,
      enlaceVirtual: cita.enlaceVirtual ?? '',
    },
  });

  let quien;
  if (!eligeFacilitador) {
    quien = (
      <Text variant="bodyMedium" style={estilos.texto}>
        {`La atiendes tú: ${yo.nombre}.`}
      </Text>
    );
  } else if (cargandoFacilitadores) {
    quien = <EstadoCarga mensaje="Cargando los facilitadores…" />;
  } else if (!facilitadores) {
    quien = (
      <EstadoError mensaje="No pudimos cargar los facilitadores." onReintentar={onReintentarFacilitadores} />
    );
  } else if (facilitadores.length === 0) {
    quien = <EstadoVacio mensaje="Nadie del personal tiene el rol de facilitador." />;
  } else {
    quien = (
      <Controller
        control={control}
        name="facilitadorId"
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <View>
            <RadioButton.Group onValueChange={onChange} value={value}>
              {facilitadores.map((opcion) => (
                <RadioButton.Item
                  key={opcion.id}
                  value={opcion.id}
                  label={opcion.nombre}
                  labelStyle={estilos.texto}
                  disabled={guardando}
                  mode="android"
                  position="leading"
                  accessibilityLabel={`Que la atienda ${opcion.nombre}`}
                />
              ))}
            </RadioButton.Group>
            <HelperText type="error" visible={error != null}>
              {error?.message}
            </HelperText>
          </View>
        )}
      />
    );
  }

  return (
    <>
      <Dialog.Title style={estilos.titulo}>Aprobar la cita</Dialog.Title>
      <Dialog.ScrollArea style={estilos.area}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <Text variant="bodyMedium" style={estilos.texto}>
            {`${cita.solicitante} · ${cita.tema}. Pidió el ${fechaCompleta(cita.fecha).toLowerCase()}, ${cita.horaInicio}.`}
          </Text>

          <Text variant="titleSmall" style={estilos.seccion} accessibilityRole="header">
            Quién la atiende
          </Text>
          {quien}

          <Text variant="titleSmall" style={estilos.seccion} accessibilityRole="header">
            Fecha y hora
          </Text>
          <Text variant="bodySmall" style={estilos.secundario}>
            Son las que pidió la persona. Si las cambias, le avisamos.
          </Text>
          <CampoFormulario
            control={control}
            nombre="fecha"
            etiqueta="Fecha"
            tipo="fecha"
            // El día que pidió siempre se puede dejar: ya pasó las reglas al solicitarla.
            motivoNoElegible={(dia) =>
              dia === cita.fecha ? null : motivoDiaReserva(dia, parametros, hoy)
            }
            mesMinimo={hoy}
            mesMaximo={sumarMeses(hoy, MESES_APROBACION)}
            deshabilitado={guardando}
          />
          <CampoFormulario
            control={control}
            nombre="hora"
            etiqueta="Hora"
            tipo="hora"
            deshabilitado={guardando}
          />

          {virtual ? (
            <Controller
              control={control}
              name="enlaceVirtual"
              render={({ field: { ref, value, onChange, onBlur }, fieldState: { error } }) => (
                <View>
                  <TextInput
                    ref={ref}
                    mode="outlined"
                    label="Enlace de la asesoría virtual"
                    placeholder="https://meet.google.com/…"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={error != null}
                    disabled={guardando}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    accessibilityLabel="Enlace de la asesoría virtual"
                  />
                  <HelperText type={error ? 'error' : 'info'} visible>
                    {error?.message ?? 'La persona lo recibe en el aviso de la aprobación.'}
                  </HelperText>
                </View>
              )}
            />
          ) : null}

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
          accessibilityLabel="Volver sin aprobar"
        >
          Volver
        </Button>
        <Button
          mode="contained"
          onPress={() => handleSubmit(onConfirmar)()}
          loading={guardando}
          disabled={guardando || (eligeFacilitador && !facilitadores?.length)}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Aprobar la cita de ${cita.solicitante}`}
        >
          Aprobar
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
  texto: { color: colores.texto },
  secundario: { color: colores.textoSecundario },
  seccion: { color: colores.primario, fontFamily: fuentes.seminegrita, marginTop: espacio.s },
  // Con letra grande, los botones pasan a otra línea en vez de cortarse.
  acciones: { flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
